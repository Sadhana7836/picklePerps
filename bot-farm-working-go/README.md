# Bot Farm

20 simulated players that play crash end-to-end against the real backend
(WebSocket + PostgreSQL). Each bot has a unique Stellar keypair so it shows up
as a distinct wallet in the leaderboard, bet history, and active-bettors list.

> **This folder is gitignored.** Keys never leave your machine.

---

## Architecture

```
bot-farm/
├── cmd/main.go              # Orchestrator — spins up N bots as goroutines
├── bot/
│   ├── bot.go               # WS connection + game loop state machine
│   ├── strategies.go        # 4 personality types (conservative → moonshot)
│   └── wallet.go            # Config struct + helpers
├── scripts/generate/main.go # Keypair generation + Friendbot funding
├── config/
│   └── bots.json            # 20 keypairs (generated, never committed)
└── go.mod
```

### How a round plays out (per bot)

```
game_start  →  [70% chance] schedule bet with 0–3 s random delay
countdown   →  (ignored, bet is in flight)
price_update →  watch multiplier; cashout when target hit
              →  [bust %] never cashout — lose the round
game_end    →  log result; sleep 2–10 s jitter; wait for next round
```

### Strategies

| Name          | Bet range (XLM) | Cashout target | Participates | Busts |
|---------------|-----------------|----------------|-------------|-------|
| conservative  | 0.001 – 0.008   | 1.15 × – 1.60× | 90 %        | 4 %   |
| steady        | 0.005 – 0.025   | 1.40 × – 2.80× | 75 %        | 10 %  |
| aggressive    | 0.020 – 0.080   | 2.00 × – 6.00× | 60 %        | 28 %  |
| moonshot      | 0.005 – 0.030   | 8.00 × – 50.0× | 40 %        | 55 %  |

Strategies are assigned round-robin by bot ID so the mix is always balanced.

---

## Setup

### 1. Install dependencies

```bash
cd bot-farm
go mod tidy
```

### 2. Generate 20 keypairs

```bash
# testnet — generates keys AND funds them via Friendbot
go run scripts/generate/main.go -n 20 -fund

# mainnet — generates keys only; fund manually
go run scripts/generate/main.go -n 20
```

This writes `config/bots.json`:

```json
[
  { "id": 1, "public_key": "GABC...", "secret_key": "SABC..." },
  ...
]
```

> **Keep `config/bots.json` secret.** It contains raw private keys.

### 3. Fund wallets (mainnet)

Send ≥ 5 XLM to each `public_key` in `bots.json` from your treasury wallet.
The bots lose small amounts each round; 5 XLM per bot gives ~hours of runtime.

```bash
# Quick check — list all bot addresses
jq '.[].public_key' config/bots.json
```

### 4. Run the farm

```bash
# Against local backend
go run cmd/main.go -ws ws://localhost:8080/ws

# Against production
go run cmd/main.go -ws wss://your-backend.com/ws -n 20

# Fewer bots for testing
go run cmd/main.go -ws ws://localhost:8080/ws -n 5
```

Stop with `Ctrl-C` — all bots drain cleanly.

---

## Flags

| Flag      | Default                     | Description                        |
|-----------|-----------------------------|------------------------------------|
| `-ws`     | `ws://localhost:8080/ws`    | Backend WebSocket URL              |
| `-config` | `config/bots.json`          | Path to keypairs file              |
| `-n`      | `20`                        | Number of bots to run              |

---

## Logs

Each bot prefixes its log lines with `[botNN|PUBKEY8]`:

```
[bot01|GABC1234] connected (conservative)
[bot01|GABC1234] bet 0.0042 XLM game=1741900800 target=1.38x
[bot01|GABC1234] cashout 1.41x game=1741900800 profit=0.0017 XLM
[bot03|GDEF5678] busted — peak=1.12x game=1741900800
```

Pipe to a file for a full session log:
```bash
go run cmd/main.go 2>&1 | tee farm.log
```

---

## Expanding

**Add a new strategy** — append to the `strategies` slice in `bot/strategies.go`.

**More bots** — regenerate with `-n 30`, fund the new addresses, run with `-n 30`.

**Mainnet → testnet switch** — just point `-ws` at your testnet backend URL.
The keys are network-agnostic; only the backend's Soroban RPC endpoint differs.

---

## Notes on "realness"

- Each bot has a distinct `playerAddress` (Stellar G… key) → 20 unique rows in
  `wallet_pnl`, 20 distinct entries in `active_bettors`, separate bet records.
- The `transactionHash` in `crash_bet_placed` is a random 64-char hex string
  (simulated). The server stores it for reference but does not validate it
  on-chain. Server-side `pay_player` payouts go to the real Stellar address.
- For fully on-chain bets (bot actually signs + submits XLM to contract),
  extend `bot/bot.go` to call the Soroban `bet()` function using the
  `SecretKey` from each bot's config — same pattern as `contract/gamehouse.go`
  in the backend.
