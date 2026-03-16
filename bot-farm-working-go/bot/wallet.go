package bot

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
)

// Config is one bot's identity — a real Stellar keypair.
type Config struct {
	ID        int    `json:"id"`
	PublicKey string `json:"public_key"`
	SecretKey string `json:"secret_key"` // S... Stellar secret key
}

// LoadConfigs reads config/bots.json and returns all bot identities.
func LoadConfigs(path string) ([]Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}
	var cfgs []Config
	if err := json.Unmarshal(data, &cfgs); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	return cfgs, nil
}

// randHex generates a random hex string of n bytes (2n hex chars).
// Used to produce a plausible-looking transaction hash for bet placement.
func randHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
