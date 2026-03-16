package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"botfarm/bot"
)

func main() {
	wsURL      := flag.String("ws",          "ws://localhost:8080/ws", "backend WebSocket URL")
	cfgPath    := flag.String("config",      "config/bots.json",       "path to bots.json")
	count      := flag.Int("n",              20,                        "number of bots to run")
	contractID := flag.String("contract",    "",                        "Soroban C... contract address (or set CONTRACT_ID env)")
	rpcURL     := flag.String("rpc",         "",                        "Soroban RPC URL (default: mainnet)")
	flag.Parse()

	// Env fallback for contract ID
	if *contractID == "" {
		*contractID = os.Getenv("CONTRACT_ID")
	}
	if *rpcURL == "" {
		*rpcURL = os.Getenv("RPC_URL")
	}

	if *contractID == "" {
		log.Println("⚠️  CONTRACT_ID not set — bots will use simulated tx hashes (dev mode)")
	} else {
		log.Printf("contract: %s", *contractID)
	}

	configs, err := bot.LoadConfigs(*cfgPath)
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	if len(configs) < *count {
		log.Fatalf("need %d bots but bots.json only has %d entries", *count, len(configs))
	}
	configs = configs[:*count]

	log.Printf("starting %d bots → %s", len(configs), *wsURL)

	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("shutting down...")
		cancel()
	}()

	opts := bot.Options{
		ContractID: *contractID,
		RPCURL:     *rpcURL,
	}

	var wg sync.WaitGroup
	for i, cfg := range configs {
		wg.Add(1)
		cfg := cfg
		// Stagger: 500 ms per bot to avoid thundering-herd on the WS.
		startDelay := time.Duration(i) * 500 * time.Millisecond
		go func() {
			defer wg.Done()
			select {
			case <-ctx.Done():
				return
			case <-time.After(startDelay):
			}
			b := bot.New(cfg, *wsURL, opts)
			b.Run(ctx)
		}()
	}

	wg.Wait()
	log.Println("all bots stopped")
}
