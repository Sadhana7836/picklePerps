// contract — thin Soroban RPC client for bot-farm.
// Mirrors crash-backend/contract/gamehouse.go but signs with the bot's own keypair
// and calls "bet" instead of "pay_player".
package contract

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/stellar/go/keypair"
	"github.com/stellar/go/network"
	"github.com/stellar/go/strkey"
	"github.com/stellar/go/txnbuild"
	"github.com/stellar/go/xdr"
)

const (
	horizonURL        = "https://horizon-testnet.stellar.org"
	defaultRPCURL     = "https://soroban-testnet.stellar.org"
	networkPassphrase = network.TestNetworkPassphrase
)

// Client calls the crash-house Soroban contract on behalf of a single bot.
type Client struct {
	contractID string
	botKP      *keypair.Full
	rpcURL     string
}

// New creates a Client for a bot.
// contractID is the C... Soroban address.
// botSecret is the bot's S... Stellar secret key.
// rpcURL is optional (defaults to mainnet).
func New(contractID, botSecret, rpcURL string) (*Client, error) {
	kp, err := keypair.ParseFull(botSecret)
	if err != nil {
		return nil, fmt.Errorf("parse bot keypair: %w", err)
	}
	if rpcURL == "" {
		rpcURL = defaultRPCURL
	}
	return &Client{contractID: contractID, botKP: kp, rpcURL: rpcURL}, nil
}

// Bet invokes bet(playerAddress, amountStroops) on the contract, signed by the bot.
// Returns the transaction hash on success.
func (c *Client) Bet(ctx context.Context, amountXLM float64) (string, error) {
	amountStroops := new(big.Int)
	f := new(big.Float).Mul(big.NewFloat(amountXLM), big.NewFloat(1e7))
	f.Int(amountStroops)

	// 1. Sequence number for the bot's own account
	seqNum, err := c.getAccountSequence(ctx, c.botKP.Address())
	if err != nil {
		return "", fmt.Errorf("get sequence: %w", err)
	}

	// 2. Build InvokeHostFunction op: bet(botAddress, amount_i128)
	op, err := c.buildBetOp(c.botKP.Address(), amountStroops)
	if err != nil {
		return "", fmt.Errorf("build op: %w", err)
	}

	// 3. Build simulation tx (sequence seqNum+1)
	simSrc := txnbuild.SimpleAccount{AccountID: c.botKP.Address(), Sequence: seqNum}
	simTx, err := txnbuild.NewTransaction(txnbuild.TransactionParams{
		SourceAccount:        &simSrc,
		IncrementSequenceNum: true,
		Operations:           []txnbuild.Operation{op},
		BaseFee:              txnbuild.MinBaseFee,
		Preconditions:        txnbuild.Preconditions{TimeBounds: txnbuild.NewTimeout(30)},
	})
	if err != nil {
		return "", fmt.Errorf("build sim tx: %w", err)
	}
	simBase64, err := simTx.Base64()
	if err != nil {
		return "", fmt.Errorf("serialize sim tx: %w", err)
	}

	// 4. Simulate — captures auth entries + soroban resource data
	simResult, err := c.simulateTransaction(ctx, simBase64)
	if err != nil {
		return "", fmt.Errorf("simulate: %w", err)
	}

	// 5. Apply simulation auth entries to the op.
	// Soroban simulation returns per-op auth entries (e.g. token.transfer authorization)
	// that MUST be set on InvokeHostFunction.Auth before signing, otherwise the
	// contract execution will trap with an authorization error.
	log.Printf("[contract] sim: results=%d", len(simResult.Results))
	if len(simResult.Results) > 0 {
		log.Printf("[contract] sim: auth entries=%d", len(simResult.Results[0].Auth))
		for i, authB64 := range simResult.Results[0].Auth {
			var entry xdr.SorobanAuthorizationEntry
			if err := xdr.SafeUnmarshalBase64(authB64, &entry); err != nil {
				return "", fmt.Errorf("parse auth entry: %w", err)
			}
			log.Printf("[contract] sim: auth[%d] credType=%v", i, entry.Credentials.Type)
			op.Auth = append(op.Auth, entry)
		}
	}

	// 6. Rebuild final tx with auth-enriched op (same sequence seqNum+1).
	finalSrc := txnbuild.SimpleAccount{AccountID: c.botKP.Address(), Sequence: seqNum + 1}
	tx, err := txnbuild.NewTransaction(txnbuild.TransactionParams{
		SourceAccount:        &finalSrc,
		IncrementSequenceNum: false, // sequence already set to seqNum+1
		Operations:           []txnbuild.Operation{op},
		BaseFee:              txnbuild.MinBaseFee,
		Preconditions:        txnbuild.Preconditions{TimeBounds: txnbuild.NewTimeout(30)},
	})
	if err != nil {
		return "", fmt.Errorf("build final tx: %w", err)
	}

	// 7. Apply soroban data + updated fee from simulation
	var sorobanData xdr.SorobanTransactionData
	if err := xdr.SafeUnmarshalBase64(simResult.TransactionData, &sorobanData); err != nil {
		return "", fmt.Errorf("parse soroban data: %w", err)
	}
	minFee, _ := strconv.ParseInt(simResult.MinResourceFee, 10, 64)
	totalFee := int64(txnbuild.MinBaseFee) + minFee

	// Verify auth entries survived the rebuild before touching XDR
	log.Printf("[contract] op.Auth count before XDR: %d", len(op.Auth))

	env := tx.ToXDR()

	// Count auth entries in XDR to confirm they were serialised
	if len(env.V1.Tx.Operations) > 0 {
		if ihf, ok := env.V1.Tx.Operations[0].Body.GetInvokeHostFunctionOp(); ok {
			log.Printf("[contract] XDR op auth count: %d", len(ihf.Auth))
		}
	}

	env.V1.Tx.Ext = xdr.TransactionExt{V: 1, SorobanData: &sorobanData}
	env.V1.Tx.Fee = xdr.Uint32(totalFee)

	envBase64, err := xdr.MarshalBase64(env)
	if err != nil {
		return "", fmt.Errorf("marshal env: %w", err)
	}
	genericTx, err := txnbuild.TransactionFromXDR(envBase64)
	if err != nil {
		return "", fmt.Errorf("parse env: %w", err)
	}
	tx2, ok := genericTx.Transaction()
	if !ok {
		return "", fmt.Errorf("expected regular transaction")
	}

	// 8. Sign with bot's keypair
	tx2, err = tx2.Sign(networkPassphrase, c.botKP)
	if err != nil {
		return "", fmt.Errorf("sign: %w", err)
	}

	// 8. Submit
	signedBase64, err := tx2.Base64()
	if err != nil {
		return "", fmt.Errorf("serialize signed: %w", err)
	}
	sendResult, err := c.sendTransaction(ctx, signedBase64)
	if err != nil {
		return "", fmt.Errorf("send: %w", err)
	}
	if sendResult.Status == "ERROR" {
		return "", fmt.Errorf("tx rejected: %s", sendResult.ErrorResultXDR)
	}

	// 9. Poll up to 30 s for confirmation
	for i := 0; i < 30; i++ {
		res, err := c.getTransaction(ctx, sendResult.Hash)
		if err == nil {
			switch res.Status {
			case "SUCCESS":
				return sendResult.Hash, nil
			case "FAILED":
				return "", fmt.Errorf("tx failed: %s", res.ResultXDR)
			}
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(1 * time.Second):
		}
	}

	// Confirmed or not, return the hash (parity with backend pay_player behaviour)
	return sendResult.Hash, nil
}

// ── XDR helpers ───────────────────────────────────────────────────────────────

func (c *Client) buildBetOp(playerAddress string, amountStroops *big.Int) (*txnbuild.InvokeHostFunction, error) {
	contractBytes, err := strkey.Decode(strkey.VersionByteContract, c.contractID)
	if err != nil {
		return nil, fmt.Errorf("decode contract id: %w", err)
	}
	var contractID xdr.ContractId
	copy(contractID[:], contractBytes)

	playerAccountID := xdr.AccountId{}
	if err := playerAccountID.SetAddress(playerAddress); err != nil {
		return nil, fmt.Errorf("parse player address: %w", err)
	}
	playerScVal := xdr.ScVal{
		Type: xdr.ScValTypeScvAddress,
		Address: &xdr.ScAddress{
			Type:      xdr.ScAddressTypeScAddressTypeAccount,
			AccountId: &playerAccountID,
		},
	}
	amountScVal := xdr.ScVal{
		Type: xdr.ScValTypeScvI128,
		I128: &xdr.Int128Parts{
			Hi: xdr.Int64(0),
			Lo: xdr.Uint64(amountStroops.Uint64()),
		},
	}

	return &txnbuild.InvokeHostFunction{
		HostFunction: xdr.HostFunction{
			Type: xdr.HostFunctionTypeHostFunctionTypeInvokeContract,
			InvokeContract: &xdr.InvokeContractArgs{
				ContractAddress: xdr.ScAddress{
					Type:       xdr.ScAddressTypeScAddressTypeContract,
					ContractId: &contractID,
				},
				FunctionName: "bet",
				Args:         xdr.ScVec{playerScVal, amountScVal},
			},
		},
	}, nil
}

// ── Horizon + Soroban RPC ─────────────────────────────────────────────────────

func (c *Client) getAccountSequence(ctx context.Context, address string) (int64, error) {
	url := fmt.Sprintf("%s/accounts/%s", horizonURL, address)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	var account struct {
		Sequence string `json:"sequence"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&account); err != nil {
		return 0, err
	}
	var seq int64
	fmt.Sscan(account.Sequence, &seq)
	return seq, nil
}

type rpcRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      int         `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
}

type rpcResponse struct {
	Result json.RawMessage `json:"result"`
	Error  *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

type simulateResult struct {
	TransactionData string `json:"transactionData"`
	MinResourceFee  string `json:"minResourceFee"`
	// Results contains per-operation auth entries returned by simulation.
	// These must be applied to the InvokeHostFunction op before signing.
	Results []struct {
		Auth []string `json:"auth"`
	} `json:"results"`
	Error string `json:"error,omitempty"`
}

type sendTxResult struct {
	Hash           string `json:"hash"`
	Status         string `json:"status"`
	ErrorResultXDR string `json:"errorResultXdr,omitempty"`
}

type getTxResult struct {
	Status    string `json:"status"`
	ResultXDR string `json:"resultXdr,omitempty"`
}

func (c *Client) rpcCall(ctx context.Context, method string, params interface{}, result interface{}) error {
	body, _ := json.Marshal(rpcRequest{JSONRPC: "2.0", ID: 1, Method: method, Params: params})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.rpcURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	var rpcResp rpcResponse
	if err := json.Unmarshal(respBody, &rpcResp); err != nil {
		return err
	}
	if rpcResp.Error != nil {
		return fmt.Errorf("rpc %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}
	return json.Unmarshal(rpcResp.Result, result)
}

func (c *Client) simulateTransaction(ctx context.Context, txXDR string) (*simulateResult, error) {
	var result simulateResult
	if err := c.rpcCall(ctx, "simulateTransaction", map[string]string{"transaction": txXDR}, &result); err != nil {
		return nil, err
	}
	if result.Error != "" {
		return nil, fmt.Errorf("simulation: %s", result.Error)
	}
	return &result, nil
}

func (c *Client) sendTransaction(ctx context.Context, txXDR string) (*sendTxResult, error) {
	var result sendTxResult
	return &result, c.rpcCall(ctx, "sendTransaction", map[string]string{"transaction": txXDR}, &result)
}

func (c *Client) getTransaction(ctx context.Context, hash string) (*getTxResult, error) {
	var result getTxResult
	return &result, c.rpcCall(ctx, "getTransaction", map[string]string{"hash": hash}, &result)
}
