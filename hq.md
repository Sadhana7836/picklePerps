# PicklePerps

## Description

PicklePerps is a high-speed perpetual trading platform on Stellar L2 that combines meme token creation with leveraged trading for both crypto and real-world assets. It provides bonding curve AMM for instant token liquidity, up to 100x leverage on perpetuals, RWA trading via Pyth oracles, and copy trading infrastructure - all accessible through web, CLI, and terminal UI.


## The Solution

PicklePerps integrates token creation, bonding curve liquidity, and perpetual trading into a unified platform:

1. **Token Launch**: Deploy tokens with 1-10% creator allocation, IPFS metadata, and instant bonding curve initialization in a single transaction.

2. **Bonding Curve Trading**: Linear AMM with automatic price discovery. Formula: `Price = initialPrice + (coefficient * sold / supply)`. No LP required.

3. **Perpetual Positions**: Open leveraged long/short positions up to 100x on any bonding curve token. Positions use curve price as oracle.

4. **RWA Perpetuals**: Trade gold, silver, oil, forex, and equities via Pyth Network oracles. Same interface, same wallet.

5. **Copy Trading**: Follow top traders and automatically mirror positions with proportional sizing and configurable profit sharing.


## Technical Architecture

| Component | Specification |
|-----------|---------------|
| Bonding Curve | Linear AMM (P = P0 + k*S) |
| Price Precision | 1e8 (8 decimals) |
| Max Leverage | 100x (tokens), 50x (forex), 20x (commodities) |
| Oracle | Pyth Network + Bonding Curve |

**Fee Structure:**

| Action | Fee |
|--------|-----|
| Token Creation | 0.01 XLM |
| Bonding Curve Trade | 0.5% |
| Meme Perpetual | 0.05% per side |
| RWA Perpetual | 0.1% per side |
| Copy Trading Profit | 5% protocol + 1-30% leader |

**Perpetual Mechanics:**

```
Position Size = Margin * Leverage
Long PnL = ((currentPrice - entryPrice) * size) / entryPrice
Short PnL = ((entryPrice - currentPrice) * size) / entryPrice
Liquidation (Long) = entryPrice * (1 - 1/leverage)
Liquidation (Short) = entryPrice * (1 + 1/leverage)
```

**Gas Costs on Stellar:**

| Operation | Cost |
|-----------|------|
| Token Creation | ~$0.01 |
| Bonding Curve Buy | ~$0.005 |
| Open Perp Position | ~$0.01 |
| Close Perp Position | ~$0.008 |


## Smart Contracts

Deployed on Stellar Testnet Testnet (Chain ID: 5003).

| Contract | Address | Explorer |
|----------|---------|----------|
| MemeTokenFactoryV3 | `0x083c920Eb055997a4becf51d9854dCd441a40b3E` | [View](https://explorer.sepolia.mantle.xyz/address/0x083c920Eb055997a4becf51d9854dCd441a40b3E) |
| BondingCurveMarket | `0x93b268325A9862645c82b32229f3B52264750Ca2` | [View](https://explorer.sepolia.mantle.xyz/address/0x93b268325A9862645c82b32229f3B52264750Ca2) |
| PerpetualTrading | `0x8081b646f349c049f2d5e8a400057d411dd657bd` | [View](https://explorer.sepolia.mantle.xyz/address/0x8081b646f349c049f2d5e8a400057d411dd657bd) |
| CopyTrading | `0x03f0b1dd70d5ad5c46fa8084965ccb5f89d9242c` | [View](https://explorer.sepolia.mantle.xyz/address/0x03f0b1dd70d5ad5c46fa8084965ccb5f89d9242c) |
| Protocol Treasury | `0x844dAea3090440468AC4B0654743ae10B99083cC` | [View](https://explorer.sepolia.mantle.xyz/address/0x844dAea3090440468AC4B0654743ae10B99083cC) |


## Supported Assets

**Meme Token Perpetuals (100x max leverage):**
- Any token created through MemeTokenFactoryV3
- Price derived from BondingCurveMarket

**Real-World Asset Perpetuals:**

| Category | Assets | Max Leverage |
|----------|--------|--------------|
| Commodities | Gold (XAU/USD), Silver (XAG/USD), Oil (WTI/USD) | 20x |
| Forex | EUR/USD, GBP/USD, JPY/USD, AUD/USD, CHF/USD | 50x |
| Equities | AAPL, TSLA, NVDA, AMZN, GOOGL, MSFT | 50x |
| Crypto | BTC/USD, ETH/USD, SOL/USD | 50x |


## Pickle CLI

Direct blockchain interaction from the terminal, eliminating browser latency and enabling automation for serious traders.

- Execute trades without browser overhead or wallet popup delays
- Wallet management with AES-256-GCM encryption stored locally
- Full platform access: spot trading, perpetuals, RWA, and portfolio tracking
- Scriptable commands for algorithmic trading strategies
- Works on servers and headless environments


## Pickle TUI

Full trading terminal rendered in the command line for traders who need speed and visual market data without a browser.

- Real-time candlestick charts directly in terminal
- Live position tracking with PnL updates
- Keyboard-driven execution with single keystrokes
- Multi-panel layout for simultaneous market monitoring
- No mouse clicks, no page loads, no confirmation popups


## Security Model

| Property | Mechanism |
|----------|-----------|
| Position Integrity | Margin held in contract |
| Liquidation | Automated threshold monitoring |
| Price Manipulation | Multi-source oracle (Curve + Pyth) |
| Access Control | Owner-only admin functions |
| Emergency | Pausable contracts |

**Liquidation Thresholds:**
- Meme Perps: Liquidation when margin depleted
- RWA Perps: 5% margin threshold
- Liquidators incentivized with rewards


## Progress During Hackathon

A complete perpetual trading infrastructure for Stellar featuring five deployed smart contracts (MemeTokenFactoryV3, BondingCurveMarket, PerpetualTrading, RWAPerpetualTrading, CopyTrading), a Next.js 15 web application with real-time trading panels and candlestick charts, a globally installable CLI with encrypted wallet management, a terminal UI for keyboard-driven trading, Pyth Network oracle integration for 15+ RWA assets, and a Goldsky-indexed subgraph with GraphQL API for historical data and analytics.


## Fundraising Status

We are seeking seed funding to conduct professional security audits of our smart contracts and perpetual trading logic, expand RWA asset coverage with additional oracle integrations, and grow our engineering team. Our goal is to raise $50k to accelerate mainnet launch on Stellar and establish PicklePerps as the primary perpetual trading infrastructure for meme tokens and real-world assets on L2.


## Links

- Website: https://pickle-perps.vercel.app
- NPM Package: https://www.npmjs.com/package/pickleperps
- GitHub: https://github.com/debanjannnn/PicklePerps
- Subgraph API: https://api.goldsky.com/api/public/project_cmj709d6q6eqo01w6advl8q19/subgraphs/pickleperps/2.1.0/gn


## Contract Addresses

0x083c920Eb055997a4becf51d9854dCd441a40b3E, 0x93b268325A9862645c82b32229f3B52264750Ca2, 0x8081b646f349c049f2d5e8a400057d411dd657bd, 0x03f0b1dd70d5ad5c46fa8084965ccb5f89d9242c, 0x844dAea3090440468AC4B0654743ae10B99083cC


0xB27705342ACE73736AE490540Ea031cc06C3eF49
