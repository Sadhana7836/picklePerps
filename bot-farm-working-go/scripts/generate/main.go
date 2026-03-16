// generate — creates N Stellar keypairs and optionally funds them via Friendbot.
//
// Usage:
//   go run scripts/generate/main.go -n 20 -out config/bots.json [-fund]
//
// -fund hits the Stellar testnet Friendbot for each address (testnet only).
// On mainnet, fund wallets manually before running the farm.

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/stellar/go/keypair"
)

type botConfig struct {
	ID        int    `json:"id"`
	PublicKey string `json:"public_key"`
	SecretKey string `json:"secret_key"`
}

func main() {
	n := flag.Int("n", 20, "number of keypairs to generate")
	out := flag.String("out", "config/bots.json", "output file path")
	fund := flag.Bool("fund", false, "fund via Stellar testnet Friendbot (testnet only!)")
	flag.Parse()

	// Ensure output directory exists.
	if err := os.MkdirAll(filepath.Dir(*out), 0755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}

	configs := make([]botConfig, *n)
	for i := range configs {
		kp, err := keypair.Random()
		if err != nil {
			log.Fatalf("keypair gen: %v", err)
		}
		configs[i] = botConfig{
			ID:        i + 1,
			PublicKey: kp.Address(),
			SecretKey: kp.Seed(),
		}
		fmt.Printf("bot%02d  %s\n", i+1, kp.Address())

		if *fund {
			if err := friendbot(kp.Address()); err != nil {
				log.Printf("       friendbot FAILED: %v", err)
			} else {
				fmt.Printf("       funded ✓\n")
			}
			// Friendbot has rate limits — be polite.
			time.Sleep(200 * time.Millisecond)
		}
	}

	data, _ := json.MarshalIndent(configs, "", "  ")
	if err := os.WriteFile(*out, data, 0600); err != nil {
		log.Fatalf("write: %v", err)
	}
	fmt.Printf("\n%d keypairs saved to %s\n", *n, *out)
	if !*fund {
		fmt.Println("re-run with -fund to top up via Friendbot (testnet), or fund manually on mainnet")
	}
}

// friendbot calls the Stellar testnet faucet for a given address.
func friendbot(address string) error {
	url := "https://friendbot.stellar.org/?addr=" + address
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, body)
	}
	return nil
}
