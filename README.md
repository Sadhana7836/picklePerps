# PicklePerps

A high-speed perpetual trading platform for tokens and real-world assets on Stellar Network. Web interface, CLI, and Terminal UI - built for traders who need speed.

![Trenches - Token List](public/readme-image/image.png)

## Why PicklePerps

Most DEXs are slow. Heavy frontends, laggy charts, delayed execution. By the time your trade goes through, the price has moved.

PicklePerps fixes that. Fast execution, real-time charts, and a terminal UI for traders who need speed. You can wait 2 seconds to cross the road - but not when you're trading perps.

## Screenshots

| Token Trading | Token Creation |
|:---:|:---:|
| ![Trading](public/readme-image/image%20copy.png) | ![Create Token](public/readme-image/image%20copy%202.png) |

| Portfolio | System Monitor |
|:---:|:---:|
| ![Portfolio](public/readme-image/image%20copy%204.png) | ![Monitor](public/readme-image/image%20copy%203.png) |

## Features

### Token Platform
- **Create Tokens** - Launch tokens with IPFS image storage and customizable creator allocation (1-10%)
- **Bonding Curve Trading** - Automatic market-making with linear price curves, no liquidity bootstrapping needed
- **Real-time Charts** - Live candlestick charts updating as trades happen

### Perpetual Trading
- **Up to 100x Leverage** - Trade long/short positions on any token
- **Real-time PnL** - Live profit/loss tracking with liquidation warnings
- **Price Feeds** - Bonding curve prices with Pyth Oracle fallback

### RWA Synthetic Assets
Trade real-world assets on-chain with leverage. No KYC, no brokers.

| Category | Assets |
|----------|--------|
| Commodities | Gold (XAU), Silver (XAG), Crude Oil (WTI) |
| Forex | EUR/USD, GBP/USD, JPY/USD |
| Equities | Apple, Tesla, NVIDIA |
| Crypto | BTC, ETH, SOL |
| Indices | S&P 500 |

All prices powered by Pyth Network - institutional-grade oracles with sub-second updates.

### Copy Trading
- **Leaderboard** - Rankings by PnL, win rate, and volume
- **Follow Leaders** - Subscribe with your capital, positions copy proportionally
- **On-chain Execution** - Smart contracts handle everything, no trust required

### Terminal UI (TUI)
Full trading terminal in your command line. No browser, no heavy frontend - just fast, keyboard-driven trading.

```
pickle terminal
```

## The Math

### Bonding Curve
```
price = initialPrice + (coefficient * soldTokens / totalSupply)
```
- Initial Price: $0.00001
- Price doubles when 100% of curve tokens sold
- Trading Fee: 0.5%

### Perpetual PnL
```
PnL = positionSize * leverage * (currentPrice - entryPrice) / entryPrice
```
- Liquidation occurs when margin is depleted
- Max leverage: 100x (tokens), 50x (forex), 20x (commodities)

## Network

| Property | Value |
|----------|-------|
| Network | Stellar Testnet |
| RPC | https://soroban-testnet.stellar.org |
| Horizon | https://horizon-testnet.stellar.org |
| Explorer | https://stellar.expert/explorer/testnet |
| Currency | XLM |

## Contract Addresses (Soroban)

| Contract | Address |
|----------|---------|
| TokenFactory | `CBE2O7ZNTL5YYDWA2DERTZZGLD2Y26DZPBS4UQG3AFKAKAHAYS7CIBC2` |
| BondingCurve | `CAYFHHMOOUKN3TR7OUPNDA7HDVFURQY4BYB2UYWP3JSEHZXGKVTTU36E` |
| PerpetualTrading | `CCPRQDXBRZYXNPLXAOEMXABMN6KCRRGNLL7FBRYNTKS576PEB35QXME5` |
| PikeToken | `CBBLCH7N4QPAQZPSOOD3ECCV4UPFEGIUEEVSDWZA5OX6MDNJ5PE7S476` |

See [CONTRACTS.md](CONTRACTS.md) for full details and explorer links.

## Getting Started

### Prerequisites
- Node.js 18+
- Freighter Wallet (Stellar)
- Stellar Testnet XLM tokens

### Web App Installation

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open https://pickle-perps.vercel.app

### CLI Installation

```bash
# Install globally
npm install -g pickleperps

# Or run from source
cd cli
npm install
npm run build
npm link
```

## CLI Usage

### Wallet Management
```bash
pickle wallet create          # Create new wallet
pickle wallet import          # Import from mnemonic
pickle wallet list            # List all wallets
pickle wallet set-active      # Set active wallet
pickle wallet balance         # Check balance
```

### Token Trading
```bash
pickle tokens list            # List all tokens
pickle tokens search <query>  # Search tokens
pickle trade buy <token>      # Buy tokens
pickle trade sell <token>     # Sell tokens
```

### Perpetual Trading
```bash
pickle perp open              # Open a position
pickle perp close             # Close a position
pickle perp positions         # View your positions
```

### RWA Trading
```bash
pickle rwa list               # List RWA assets
pickle rwa open               # Open RWA position
pickle rwa close              # Close RWA position
pickle rwa positions          # View RWA positions
```

### Portfolio & History
```bash
pickle portfolio              # View portfolio
pickle history                # Trade history
pickle leaderboard            # View leaderboard
```

### Terminal UI
```bash
pickle terminal               # Launch full TUI
pickle tui                    # Alias for terminal
```

## TUI Keybindings

| Key | Action |
|-----|--------|
| `1-5` | Switch views |
| `Tab` | Navigate between panels |
| `b` | Buy token |
| `s` | Sell token |
| `l` | Open long position |
| `h` | Open short position |
| `c` | Close position |
| `r` | Refresh data |
| `/` | Search |
| `q` | Quit |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Web3 | @stellar/stellar-sdk, @stellar/freighter-api |
| State | Zustand, TanStack Query |
| Blockchain | Stellar Network (Soroban) |
| Storage | IPFS via Pinata |

## Project Structure

```
PicklePerps/
├── app/                    # Next.js app directory
├── components/             # React components
├── contracts-stellar/      # Soroban smart contracts (Rust)
│   ├── pike_token/
│   ├── token_factory/
│   ├── bonding_curve/
│   └── perpetual_trading/
├── cli/                    # CLI and TUI
│   └── src/
│       ├── commands/       # CLI commands
│       └── tui/            # Terminal UI
├── hooks/                  # React hooks
├── lib/                    # Utilities
└── subgraph/               # GraphQL indexing
```

## Environment Variables

```env
# Stellar
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# IPFS
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
```

## Development

### Smart Contracts (Soroban)
```bash
cd contracts-stellar

# Build all contracts
stellar contract build

# Deploy (uses deploy.sh)
bash deploy.sh
```

## Links

- **Web App**: https://pickle-perps.vercel.app
- **GitHub**: https://github.com/debanjannnn/PicklePerps
- **NPM**: https://www.npmjs.com/package/pickleperps

## License

MIT

---

**PicklePerps. Built for degens, by degens.**
