# PicklePerps - Complete Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
   - [MemeToken & MemeTokenFactory](#memetokenfactory)
   - [BondingCurveMarket](#bondingcurvemarket)
   - [PerpetualTrading](#perpetualtrading)
   - [RWAPerpetualTrading](#rwaperpetualtrading)
   - [CopyTrading](#copytrading)
4. [DeFi Mathematics](#defi-mathematics)
5. [Application Flow](#application-flow)
6. [CLI Tool](#cli-tool)
7. [Frontend Architecture](#frontend-architecture)
8. [Subgraph & Indexing](#subgraph--indexing)
9. [Deployment Addresses](#deployment-addresses)

---

## Overview

**PicklePerps** is a decentralized meme token platform built on **Stellar Network** that combines:

- **Meme Token Creation**: Users can mint custom ERC-20 meme tokens with IPFS-stored images
- **Bonding Curve Trading**: Automated market making with linear price curves
- **Perpetual Trading**: Leveraged long/short positions (up to 100x) on meme tokens
- **RWA Perpetuals**: Trade real-world assets (Gold, Silver, Oil, BTC, ETH, SOL) with Pyth Oracle price feeds
- **Copy Trading**: Follow and copy trades from top-performing leaders

### Key Features

- Token creation with 1-10% creator allocation
- Linear bonding curve for automatic price discovery
- Up to 100x leverage on perpetual positions
- Copy trading with profit sharing (1-30%)
- Multi-platform: Web UI, CLI, and TUI (Terminal UI)

---

## Architecture

```
+------------------+     +-------------------+     +------------------+
|   Frontend       |     |   CLI / TUI       |     |   Subgraph       |
|   (Next.js)      |     |   (Node.js)       |     |   (GraphQL)      |
+--------+---------+     +---------+---------+     +--------+---------+
         |                         |                        |
         |    +--------------------+--------------------+   |
         |    |                                         |   |
         v    v                                         v   v
+--------+----+----+     +-------------------+     +----+---+--------+
|     Wagmi/Viem   |     |   Pyth Oracle     |     |   Event Indexer |
|   (Web3 Client)  |     |   (Price Feeds)   |     |   (Blockchain)  |
+--------+---------+     +---------+---------+     +--------+--------+
         |                         |                        |
         +-----------+-------------+------------------------+
                     |
                     v
    +----------------+----------------+
    |                                 |
    |   Stellar Testnet Blockchain    |
    |                                 |
    |  +---------------------------+ |
    |  | MemeTokenFactoryV3        | |
    |  +---------------------------+ |
    |  | BondingCurveMarket        | |
    |  +---------------------------+ |
    |  | PerpetualTrading          | |
    |  +---------------------------+ |
    |  | RWAPerpetualTrading       | |
    |  +---------------------------+ |
    |  | CopyTrading               | |
    |  +---------------------------+ |
    |                                 |
    +---------------------------------+
```

---

## Smart Contracts

### MemeTokenFactory

**File**: `contracts/MemeTokenFactoryV3.sol`

The factory contract creates new meme tokens with automatic bonding curve integration.

#### Token Creation Flow

1. User calls `createToken()` with name, symbol, supply, image hash, and allocation
2. Factory deploys a new `MemeTokenV2` contract
3. Token supply is split:
   - **Creator**: Gets 1-10% (configurable via `_creatorAllocationBps`)
   - **Bonding Curve**: Gets the remaining 90-99%
4. Factory calls `BondingCurveMarket.initializeCurve()` to list the token

#### Key Functions

```solidity
function createToken(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    string memory _imageHash,
    uint256 _creatorAllocationBps,  // 100-1000 (1%-10%)
    string memory _website,
    string memory _twitter,
    string memory _telegram
) public payable returns (address tokenAddress)
```

#### Token Structure (MemeToken.sol)

```solidity
contract MemeToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    string public imageHash;      // IPFS CID
    address public creator;
    uint256 public createdAt;
}
```

---

### BondingCurveMarket

**File**: `contracts/BondingCurveMarket.sol`

Implements automatic market making using a **linear bonding curve**.

#### Curve Configuration

```solidity
struct CurveConfig {
    address token;
    address creator;
    uint256 creatorAllocationBps;  // 100-1000 (1%-10%)
    uint256 initialPrice;          // Starting price (1e8 precision)
    uint256 curveCoefficient;      // Price growth rate
    uint256 curveSupply;           // Total tokens on curve
    uint256 soldFromCurve;         // Tokens sold so far
    uint256 reserveBalance;        // ETH/XLM reserve
    uint256 createdAt;
    bool isActive;
}
```

#### Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `PRECISION` | 1e18 | Calculation precision |
| `PRICE_PRECISION` | 1e8 | USD price precision |
| `tradingFeeBps` | 50 (0.5%) | Trading fee in basis points |
| `defaultInitialPrice` | 1e3 ($0.00001) | Starting token price |
| `defaultCurveCoefficient` | 1e4 | Price doubles when 100% sold |

#### Price Formula

```
price = initialPrice + (curveCoefficient * soldFromCurve / curveSupply)
```

This is a **linear bonding curve** where:
- Price starts at `initialPrice`
- Price increases linearly as more tokens are sold
- When all tokens are sold (`soldFromCurve = curveSupply`), price = `initialPrice + curveCoefficient`

#### Buy/Sell Functions

```solidity
function buy(address _token, uint256 _minTokensOut) external payable returns (uint256 tokensOut)
function sell(address _token, uint256 _tokenAmount, uint256 _minEthOut) external returns (uint256 ethOut)
```

---

### PerpetualTrading

**File**: `contracts/PerpetualTrading.sol`

Enables leveraged perpetual futures trading on meme tokens.

#### Position Structure

```solidity
struct Position {
    address user;
    address token;
    bool isLong;
    uint256 size;           // Position size in USD (scaled)
    uint256 margin;         // Margin deposited
    uint256 leverage;       // Leverage multiplier (1-100)
    uint256 entryPrice;     // Entry price (1e8 precision)
    uint256 entryTime;
    uint256 lastFundingTime;
    bool isOpen;
}
```

#### Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `tradingFeeBps` | 5 (0.05%) | Trading fee |
| `maxLeverage` | 100 | Maximum leverage |
| `minMarginBps` | 1000 (10%) | Minimum margin requirement |

#### Price Sources (Priority Order)

1. **Bonding Curve Market** - Primary source for listed meme tokens
2. **Pyth Oracle** - For tokens with configured price feeds
3. **Last Trade Price** - Fallback for legacy support

#### Core Functions

```solidity
function openPosition(
    address _token,
    bool _isLong,
    uint256 _margin,
    uint256 _leverage
) public payable returns (uint256 positionId)

function closePosition(uint256 _positionId) public

function liquidatePosition(uint256 _positionId) public
```

---

### RWAPerpetualTrading

**File**: `contracts/RWAPerpetualTrading.sol`

Perpetual trading for Real World Assets using **Pyth Network** oracle price feeds.

#### Supported Assets

| Asset | Symbol | Pyth Feed ID |
|-------|--------|--------------|
| Gold | XAU/USD | `0xfe650f...` |
| Silver | XAG/USD | `0xf2fb02...` |
| Crude Oil | WTI | `0xc7c600...` |
| Bitcoin | BTC/USD | `0xe62df6...` |
| Ethereum | ETH/USD | `0xff6149...` |
| Solana | SOL/USD | `0xef0d8b...` |

#### Asset Configuration

```solidity
struct AssetConfig {
    bytes32 priceFeedId;    // Pyth price feed ID
    uint256 maxLeverage;    // Asset-specific max leverage
    uint256 minMargin;      // Asset-specific min margin
    bool isActive;
    string symbol;          // e.g., "XAU/USD"
}
```

#### Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `tradingFeeBps` | 10 (0.1%) | Trading fee |
| `defaultMaxLeverage` | 50 | Default max leverage |
| `MAX_LEVERAGE_CAP` | 200 | Absolute max leverage |
| `LIQUIDATION_THRESHOLD` | 5% | Remaining margin for liquidation |
| `PRICE_STALENESS` | 300s (5 min) | Max price age |

#### Position Structure (Optimized)

```solidity
struct Position {
    address user;
    bytes32 assetId;
    uint128 margin;         // Packed storage
    uint128 size;
    int64 entryPrice;       // Pyth price format
    int32 entryExpo;        // Pyth exponent
    uint32 leverage;
    uint32 entryTime;
    bool isLong;
    bool isOpen;
}
```

---

### CopyTrading

**File**: `contracts/CopyTrading.sol`

Social trading system allowing users to automatically copy top traders.

#### Leader Structure

```solidity
struct Leader {
    address wallet;
    uint256 profitShareBps;      // 100-3000 (1%-30%)
    uint256 minFollowAmount;
    uint256 totalFollowers;
    uint256 totalCopiedVolume;
    uint256 totalProfitEarned;
    uint256 registeredAt;
    bool isActive;
}
```

#### Subscription Configuration

```solidity
struct SubscriptionConfig {
    uint256 allocationAmount;    // Total allocation for copy trading
    uint256 maxLeverage;         // Leverage cap (0 = no cap)
    uint256 maxPositionSize;     // Max margin per position
    bool copyLongs;              // Copy long positions
    bool copyShorts;             // Copy short positions
    bool copyMeme;               // Copy token perps
    bool copyRWA;                // Copy RWA perps
    bool useProportionalCopy;    // Percentage-based sizing
}
```

#### Fee Structure

| Fee Type | Rate | Description |
|----------|------|-------------|
| Min Profit Share | 1% | Minimum leader profit share |
| Max Profit Share | 30% | Maximum leader profit share |
| Protocol Fee | 5% | Platform fee on profits |

#### Copy Position Sizing

**Proportional Mode** (`useProportionalCopy = true`):
```
followerMargin = (leaderMargin / leaderCapital) * followerAllocation
```

**Fixed Mode** (`useProportionalCopy = false`):
```
followerMargin = min(followerAllocation, leaderMargin)
```

---

## DeFi Mathematics

### 1. Bonding Curve Pricing

#### Linear Bonding Curve Formula

```
P(s) = a + (b * s / S)

Where:
- P(s) = Price when s tokens have been sold
- a = initialPrice (default: 1e3 = $0.00001)
- b = curveCoefficient (default: 1e4)
- s = soldFromCurve (tokens already sold)
- S = curveSupply (total tokens on curve)
```

#### Price at Different Supply Levels

| Sold % | Price Multiplier | Price (if initial = $0.00001) |
|--------|------------------|-------------------------------|
| 0% | 1.0x | $0.00001 |
| 25% | 1.25x | $0.0000125 |
| 50% | 1.5x | $0.000015 |
| 75% | 1.75x | $0.0000175 |
| 100% | 2.0x | $0.00002 |

#### Cost to Buy (Integral)

The cost to buy from supply `s1` to `s2`:

```
Cost = a * (s2 - s1) + b * (s2² - s1²) / (2 * S)
```

#### Proceeds from Selling (Integral)

The proceeds from selling from supply `s1` down to `s2`:

```
Proceeds = a * (s1 - s2) + b * (s1² - s2²) / (2 * S)
         = a * tokenAmount + b * (s1 + s2) * tokenAmount / (2 * S)
```

### 2. Perpetual Position Math

#### Position Size Calculation

```
positionSize = (margin * leverage * currentPrice) / 1e18
```

#### PnL Calculation

**Long Position:**
```
if (currentPrice >= entryPrice):
    PnL = ((currentPrice - entryPrice) * size) / entryPrice
    isProfit = true
else:
    PnL = ((entryPrice - currentPrice) * size) / entryPrice
    isProfit = false
```

**Short Position:**
```
if (currentPrice <= entryPrice):
    PnL = ((entryPrice - currentPrice) * size) / entryPrice
    isProfit = true
else:
    PnL = ((currentPrice - entryPrice) * size) / entryPrice
    isProfit = false
```

#### Liquidation Price

**Long Position:**
```
liquidationPrice = entryPrice * (1 - margin/size)
                 = entryPrice * (1 - 1/leverage)
```

**Short Position:**
```
liquidationPrice = entryPrice * (1 + margin/size)
                 = entryPrice * (1 + 1/leverage)
```

#### Example: 10x Long Position

```
Entry Price: $100
Leverage: 10x
Margin: $10

Position Size = $10 * 10 = $100

Liquidation Price = $100 * (1 - 1/10) = $100 * 0.9 = $90

If price goes to $110 (+10%):
  PnL = (($110 - $100) * $100) / $100 = $10 (100% profit on margin!)

If price goes to $95 (-5%):
  PnL = (($100 - $95) * $100) / $100 = $5 loss (50% of margin)
```

### 3. Trading Fees

#### Bonding Curve Fee
```
fee = ethAmount * tradingFeeBps / 10000
    = ethAmount * 50 / 10000
    = 0.5% of trade value
```

#### Perpetual Trading Fee
```
fee = positionSize * tradingFeeBps / 10000
    = positionSize * 5 / 10000
    = 0.05% of position size

// Fee is charged on both open and close
totalFee = 0.05% * 2 = 0.1% round-trip
```

#### RWA Trading Fee
```
fee = margin * tradingFeeBps / 10000
    = margin * 10 / 10000
    = 0.1% of margin
```

### 4. Copy Trading Profit Distribution

```
Profit earned by follower: P

Protocol Fee = P * 5%
Leader Share = P * leaderProfitShareBps / 10000
Follower Net = P - Protocol Fee - Leader Share

Example (10% leader share):
  Profit: $100
  Protocol Fee: $5
  Leader Share: $10
  Follower Net: $85
```

---

## Application Flow

### Token Lifecycle

```
1. CREATE TOKEN
   User → MemeTokenFactoryV3.createToken()
                ↓
   Deploy new MemeTokenV2 contract
                ↓
   Mint tokens: X% to creator, (100-X)% to BondingCurveMarket
                ↓
   BondingCurveMarket.initializeCurve()
                ↓
   Token is now tradeable!

2. SPOT TRADING (Bonding Curve)
   BUY:  User sends XLM → BondingCurveMarket.buy() → Receives tokens
   SELL: User sends tokens → BondingCurveMarket.sell() → Receives XLM

3. PERPETUAL TRADING
   OPEN:  User deposits margin → PerpetualTrading.openPosition() → Position created
   CLOSE: User calls closePosition() → PnL settled → Margin ± PnL returned
   LIQUIDATE: Anyone can call liquidatePosition() if underwater → Liquidator gets 5% reward

4. COPY TRADING
   LEADER:   registerAsLeader() → Set profit share → Trade normally
   FOLLOWER: subscribe() → executeCopyMeme/RWA() when leader trades
   CLOSE:    closeCopiedPosition() → PnL distributed
```

### Data Flow Diagram

```
+-------------+    createToken()    +-------------------+
|   User      | -----------------> |  MemeTokenFactory |
+-------------+                     +-------------------+
      |                                     |
      |                                     | initializeCurve()
      |                                     v
      |    buy()/sell()           +-------------------+
      +-------------------------> | BondingCurveMarket|
      |                           +-------------------+
      |                                     |
      |                                     | getCurrentPrice()
      |                                     v
      |    openPosition()         +-------------------+
      +-------------------------> |  PerpetualTrading |
      |                           +-------------------+
      |                                     |
      |                                     | Pyth Oracle
      |                                     v
      |    openPosition()         +-------------------+
      +-------------------------> | RWAPerpetualTrading|
      |                           +-------------------+
      |
      |    executeCopy()          +-------------------+
      +-------------------------> |    CopyTrading    |
                                  +-------------------+
```

---

## CLI Tool

**Location**: `/cli/`

### Installation

```bash
npm install -g pickleperps
```

### Available Commands

#### Wallet Management
```bash
pickle wallet setup       # Create or import a wallet
pickle wallet show        # Display wallet address
pickle wallet balance     # Check XLM and token balances
pickle wallet export      # Export private key
```

#### Token Discovery
```bash
pickle tokens list              # List all available tokens
pickle tokens trending          # Show trending tokens by volume
pickle tokens search <query>    # Search tokens by name or symbol
pickle tokens info <address>    # Get detailed token information
```

#### Spot Trading (Bonding Curve)
```bash
pickle trade buy <token> <amount>     # Buy tokens with XLM
pickle trade sell <token> <amount>    # Sell tokens for XLM
pickle trade quote <token> <amount>   # Get price quote
```

#### Perpetual Trading
```bash
pickle perp open <token>        # Open a leveraged position
pickle perp close <positionId>  # Close a position
pickle perp list                # List all open positions
pickle perp pnl                 # View profit and loss
```

Options:
- `-s, --side <side>` - Position side: long or short
- `-m, --margin <amount>` - Margin amount in XLM
- `-l, --leverage <number>` - Leverage multiplier (1-100)

#### RWA Trading
```bash
pickle rwa list                 # List available RWA assets
pickle rwa open <asset>         # Open RWA position
pickle rwa close <positionId>   # Close RWA position
pickle rwa positions            # View RWA positions
```

#### Terminal UI
```bash
pickle terminal    # Launch interactive TUI dashboard
pickle tui         # Alias for terminal
```

### CLI Architecture

```
cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── types.ts              # TypeScript types
│   ├── commands/             # CLI commands
│   │   ├── wallet.ts         # Wallet management
│   │   ├── tokens.ts         # Token listing
│   │   ├── trade.ts          # Spot trading
│   │   ├── perp.ts           # Perpetual trading
│   │   ├── rwa.ts            # RWA trading
│   │   ├── portfolio.ts      # Portfolio view
│   │   ├── history.ts        # Transaction history
│   │   ├── leaderboard.ts    # Top traders
│   │   └── config.ts         # Configuration
│   ├── lib/                  # Utilities
│   │   ├── client.ts         # Viem client setup
│   │   ├── contracts.ts      # Contract interactions
│   │   ├── wallet.ts         # Wallet encryption
│   │   ├── subgraph.ts       # GraphQL queries
│   │   ├── prompts.ts        # User prompts
│   │   └── ui.ts             # Terminal UI helpers
│   └── tui/                  # Terminal UI
│       ├── index.ts          # TUI entry point
│       ├── components/       # blessed UI components
│       │   ├── App.ts        # Main application
│       │   └── Dialogs.ts    # Modal dialogs
│       └── lib/              # TUI utilities
```

### Wallet Security

- Private keys encrypted with **AES-256-GCM**
- Stored at `~/.pickle/keystore.json`
- Password required for every transaction

---

## Frontend Architecture

**Stack**: Next.js 14, React, TypeScript, Tailwind CSS, Wagmi, Viem, RainbowKit

### Directory Structure

```
├── app/                  # Next.js app directory (pages)
├── components/           # React components
│   ├── TokenCard.tsx
│   ├── TokenDetailPage.tsx
│   ├── TradingPanel.tsx
│   ├── BondingCurvePanel.tsx
│   ├── PositionsList.tsx
│   ├── copy-trading/     # Copy trading components
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useBondingCurve.ts
│   ├── usePerpetualTrading.ts
│   ├── useRWAPerpetualTrading.ts
│   ├── useCopyTrading.ts
│   ├── useMemeTokens.ts
│   └── ...
└── lib/                  # Utilities and configurations
```

### Key Hooks

#### useBondingCurve
```typescript
const { data, actions, state } = useBondingCurve(tokenAddress);

// data
data.currentPrice    // Current token price
data.curveConfig     // Full curve configuration
data.isListed        // Whether token is listed
data.curveProgress   // % of tokens sold (0-100)
data.reserve         // ETH/XLM reserve balance

// actions
actions.buy(ethAmount, minTokensOut)
actions.sell(tokenAmount, minEthOut)

// state
state.isLoading, state.isPending, state.isConfirming, state.hash
```

#### usePerpetualTrading
```typescript
const { userPositionIds, actions, state } = usePerpetualTrading();

// actions
actions.openPosition(token, isLong, margin, leverage)
actions.closePosition(positionId)
actions.updateMemeTokenPrice(token, price)
```

#### useBuyQuote / useSellQuote
```typescript
const { quote, isLoading } = useBuyQuote(tokenAddress, ethAmount);

// quote
quote.tokensOut    // Tokens received
quote.avgPrice     // Average execution price
quote.fee          // Trading fee
quote.priceImpact  // Price impact %
```

---

## Subgraph & Indexing

**Location**: `/subgraph/`

### Indexed Contracts

| Contract | Events Indexed |
|----------|----------------|
| MemeTokenFactoryV3 | TokenCreated |
| BondingCurveMarket | CurveInitialized, TokenBought, TokenSold, FeesWithdrawn |
| PerpetualTrading | PositionOpened, PositionClosed, PositionLiquidated |
| CopyTrading | LeaderRegistered, FollowerSubscribed, CopyTradeExecuted, etc. |

### Entities

```graphql
type Token @entity {
  id: ID!
  address: Bytes!
  name: String!
  symbol: String!
  totalSupply: BigInt!
  imageHash: String!
  creator: User!
  createdAt: BigInt!
  price: BigDecimal!
  volume24h: BigDecimal!
  trades: [Trade!]!
}

type Trade @entity {
  id: ID!
  token: Token!
  user: User!
  type: String!  # "buy" or "sell"
  ethAmount: BigInt!
  tokenAmount: BigInt!
  price: BigDecimal!
  timestamp: BigInt!
}

type Position @entity {
  id: ID!
  positionId: BigInt!
  user: User!
  token: Token!
  isLong: Boolean!
  size: BigInt!
  margin: BigInt!
  leverage: Int!
  entryPrice: BigInt!
  entryTime: BigInt!
  isOpen: Boolean!
  pnl: BigInt
  exitPrice: BigInt
  closedAt: BigInt
}

type Leader @entity {
  id: ID!
  wallet: Bytes!
  profitShareBps: Int!
  minFollowAmount: BigInt!
  totalFollowers: Int!
  totalCopiedVolume: BigInt!
  totalProfitEarned: BigInt!
  registeredAt: BigInt!
  isActive: Boolean!
}
```

### Subgraph Deployment

```bash
cd subgraph
npm install
npm run codegen
npm run build
npm run deploy
```

---

## Deployment Addresses

**Network**: Stellar Testnet Testnet (Chain ID: 5003)

| Contract | Address |
|----------|---------|
| MemeTokenFactoryV3 | `0x083c920Eb055997a4becf51d9854dCd441a40b3E` |
| BondingCurveMarket | `0x93b268325A9862645c82b32229f3B52264750Ca2` |
| PerpetualTrading | `0x8081b646f349c049f2d5e8a400057d411dd657bd` |
| CopyTrading | `0x03f0b1dd70d5ad5c46fa8084965ccb5f89d9242c` |
| Will Contract | `0xf7ee5d6fdebdc25e08ebffc8f77ec3a59a1403da` |
| Protocol Treasury | `0x844dAea3090440468AC4B0654743ae10B99083cC` |

### Network Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | Stellar Testnet Testnet |
| Chain ID | 5003 (0x138b) |
| RPC URL | https://mantle-sepolia.drpc.org |
| Block Explorer | https://explorer.sepolia.mantle.xyz |
| Native Currency | XLM |

---

## Quick Reference

### Trading Fee Summary

| Platform | Fee | Notes |
|----------|-----|-------|
| Bonding Curve | 0.5% | On buy/sell |
| Meme Perps | 0.05% | On open/close |
| RWA Perps | 0.1% | On open/close |
| Copy Trading | 5% protocol + 1-30% leader | On profits only |

### Leverage Limits

| Platform | Max Leverage |
|----------|--------------|
| Meme Perps | 100x |
| RWA Perps | 50x (default), 200x (absolute max) |

### Liquidation Thresholds

| Platform | Threshold |
|----------|-----------|
| Meme Perps | Margin depleted (0%) |
| RWA Perps | 5% margin remaining |

---

## License

MIT
