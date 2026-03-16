package bot

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"

	"botfarm/contract"

	"github.com/gorilla/websocket"
)

// message is the unified WS envelope used by the backend.
type message struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data,omitempty"`
}

// Options are shared settings passed from the orchestrator.
type Options struct {
	ContractID string // C... Soroban contract address
	RPCURL     string // optional, defaults to mainnet
}

// Bot is a single simulated player.
type Bot struct {
	id        int
	publicKey string
	secretKey string
	strategy  Strategy
	rng       *rand.Rand
	wsURL     string
	opts      Options
	log       *log.Logger

	conn    *websocket.Conn
	writeMu sync.Mutex
}

// New creates a Bot from a keypair config.
func New(cfg Config, wsURL string, opts Options) *Bot {
	return &Bot{
		id:        cfg.ID,
		publicKey: cfg.PublicKey,
		secretKey: cfg.SecretKey,
		strategy:  Assign(cfg.ID),
		rng:       rand.New(rand.NewSource(int64(cfg.ID)*1e9 + time.Now().UnixNano())),
		wsURL:     wsURL,
		opts:      opts,
		log:       log.New(log.Writer(), fmt.Sprintf("[bot%02d|%s] ", cfg.ID, cfg.PublicKey[:8]), log.LstdFlags),
	}
}

// Run is the outer reconnect loop.
func (b *Bot) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		if err := b.connect(ctx); err != nil {
			b.log.Printf("connect: %v — retry in 5s", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(5 * time.Second):
			}
			continue
		}

		b.log.Printf("connected (%s)", b.strategy.Name)
		b.gameLoop(ctx)
		b.conn.Close()
		b.log.Printf("disconnected — reconnecting")
	}
}

func (b *Bot) connect(ctx context.Context) error {
	dialer := websocket.Dialer{HandshakeTimeout: 10 * time.Second}
	conn, _, err := dialer.DialContext(ctx, b.wsURL, nil)
	if err != nil {
		return err
	}
	b.conn = conn
	return b.write(message{
		Type: "subscribe",
		Data: map[string]interface{}{"channel": "crash"},
	})
}

func (b *Bot) gameLoop(ctx context.Context) {
	var (
		gameID    string
		betAmt    float64
		entryMult float64
		target    float64
		hasBet    bool
		willBust  bool
	)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		b.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		_, raw, err := b.conn.ReadMessage()
		if err != nil {
			b.log.Printf("read: %v", err)
			return
		}

		var msg message
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}

		switch msg.Type {

		case "game_start":
			id, _ := msg.Data["gameId"].(string)
			gameID = id
			hasBet = false

			if !b.strategy.shouldBet(b.rng) {
				b.log.Printf("skip round %s", gameID)
				continue
			}

			betAmt = b.strategy.rollBet(b.rng)
			entryMult = 1.0
			target = b.strategy.rollCashout(b.rng)
			willBust = b.strategy.willBust(b.rng)

			// Fire bet in a goroutine so we don't block the read loop.
			// Delay 0–3 s to spread bets across the 5 s countdown window.
			go b.scheduleBet(ctx, gameID, betAmt, entryMult, target, &hasBet)

		case "price_update":
			if !hasBet || willBust {
				continue
			}
			mult, ok := msg.Data["multiplier"].(float64)
			if !ok {
				continue
			}
			if mult >= target {
				if err := b.cashout(gameID, betAmt, entryMult, mult); err != nil {
					b.log.Printf("cashout err: %v", err)
					continue
				}
				hasBet = false
				b.log.Printf("cashout %.2fx game=%s profit=+%.4f XLM", mult, gameID, betAmt*(mult-1))
			}

		case "game_end":
			if hasBet {
				peak, _ := msg.Data["peakMultiplier"].(float64)
				b.log.Printf("busted peak=%.2fx game=%s loss=-%.4f XLM", peak, gameID, betAmt)
				hasBet = false
			}
			jitter := time.Duration(2000+b.rng.Intn(8000)) * time.Millisecond
			time.Sleep(jitter)
		}
	}
}

// scheduleBet waits a random delay, calls bet() on-chain, then notifies the WS.
func (b *Bot) scheduleBet(ctx context.Context, gameID string, amt, entryMult, target float64, hasBet *bool) {
	delay := time.Duration(b.rng.Intn(3000)) * time.Millisecond
	select {
	case <-ctx.Done():
		return
	case <-time.After(delay):
	}

	txHash, err := b.callBetContract(ctx, amt)
	if err != nil {
		b.log.Printf("contract bet failed: %v — skipping round", err)
		return
	}

	if err := b.placeBet(gameID, amt, entryMult, txHash); err != nil {
		b.log.Printf("ws bet err: %v", err)
		return
	}
	*hasBet = true
	b.log.Printf("bet %.4f XLM game=%s target=%.2fx txHash=%s", amt, gameID, target, txHash[:12])
}

// callBetContract calls bet(address, amount) on the Soroban contract.
// Returns the on-chain transaction hash.
func (b *Bot) callBetContract(ctx context.Context, amountXLM float64) (string, error) {
	if b.opts.ContractID == "" {
		// No contract configured — fall back to a simulated hash (dev/testnet mode).
		b.log.Printf("CONTRACT_ID not set — using simulated tx hash")
		return randHex(32), nil
	}

	c, err := contract.New(b.opts.ContractID, b.secretKey, b.opts.RPCURL)
	if err != nil {
		return "", fmt.Errorf("init contract client: %w", err)
	}

	betCtx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()

	return c.Bet(betCtx, amountXLM)
}

func (b *Bot) placeBet(gameID string, amt, entryMult float64, txHash string) error {
	return b.write(message{
		Type: "crash_bet_placed",
		Data: map[string]interface{}{
			"playerAddress":   b.publicKey,
			"userId":          b.publicKey,
			"gameId":          gameID,
			"betAmount":       amt,
			"entryMultiplier": entryMult,
			"transactionHash": txHash,
		},
	})
}

func (b *Bot) cashout(gameID string, betAmt, entryMult, cashoutMult float64) error {
	return b.write(message{
		Type: "crash_cashout",
		Data: map[string]interface{}{
			"playerAddress":     b.publicKey,
			"userId":            b.publicKey,
			"gameId":            gameID,
			"cashoutMultiplier": cashoutMult,
			"betAmount":         betAmt,
			"entryMultiplier":   entryMult,
		},
	})
}

func (b *Bot) write(msg message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	b.writeMu.Lock()
	defer b.writeMu.Unlock()
	return b.conn.WriteMessage(websocket.TextMessage, data)
}
