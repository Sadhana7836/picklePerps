# PicklePerps

A high-speed perpetual trading platform for tokens and real-world assets on Stellar Network. Web interface, CLI, and Terminal UI - built for traders who need speed.

## Why PicklePerps

Most DEXs are slow. Heavy frontends, laggy charts, delayed execution. By the time your trade goes through, the price has moved.

PicklePerps fixes that. Fast execution, real-time charts, and a terminal UI for traders who need speed. You can wait 2 seconds to cross the road - but not when you're trading perps.

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
| Network | Stellar Testnet Testnet |
| Chain ID | 5003 |
| RPC | https://mantle-sepolia.drpc.org |
| Explorer | https://explorer.sepolia.mantle.xyz |
| Currency | XLM |

## Contract Addresses

| Contract | Address |
|----------|---------|
| MemeTokenFactoryV3 | `0x083c920Eb055997a4becf51d9854dCd441a40b3E` |
| BondingCurveMarket | `0x93b268325A9862645c82b32229f3B52264750Ca2` |
| PerpetualTrading | `0x8081b646f349c049f2d5e8a400057d411dd657bd` |
| RWAPerpetualTrading | See CONTRACTS.md |
| CopyTrading | See CONTRACTS.md |

## Getting Started

### Prerequisites
- Node.js 18+
- A wallet (MetaMask, Coinbase Wallet, etc.)
- Stellar Testnet testnet XLM tokens

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

Open http://localhost:3000

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
| Web3 | Wagmi, Viem, RainbowKit |
| CLI | Commander.js, Inquirer |
| TUI | Blessed |
| Blockchain | Stellar Network (EVM) |
| Oracles | Pyth Network |
| Storage | IPFS via Pinata |
| Indexing | The Graph / Goldsky |

## Project Structure

```
PicklePerps/
├── app/                    # Next.js app directory
├── components/             # React components
├── contracts/              # Solidity smart contracts
│   ├── MemeTokenFactoryV3.sol
│   ├── BondingCurveMarket.sol
│   ├── PerpetualTrading.sol
│   ├── RWAPerpetualTrading.sol
│   └── CopyTrading.sol
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
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# IPFS
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt

# Subgraph
NEXT_PUBLIC_SUBGRAPH_URL=your_subgraph_url
```

## Development

### Smart Contracts
```bash
# Compile
npx hardhat compile

# Deploy
npx hardhat ignition deploy ./ignition/modules/Deploy.ts --network mantleSepolia

# Verify
npx hardhat verify --network mantleSepolia <address>
```

### Subgraph
```bash
cd subgraph
graph codegen
graph build
graph deploy
```

## Links

- **Web App**: https://pickle-perps.vercel.app
- **GitHub**: https://github.com/debanjannnn/PicklePerps
- **NPM**: https://www.npmjs.com/package/pickleperps

## License

MIT

---

**PicklePerps. Built for degens, by degens.**
