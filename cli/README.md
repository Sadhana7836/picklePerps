# Pickle Perps CLI

Trade tokens and real world assets on Stellar from the command line.

## Installation

```bash
npm install -g pickleperps
```

## Quick Start

```bash
# Create a new wallet
pickle wallet setup

# View your balance
pickle wallet balance

# Browse available tokens
pickle tokens list

# View trending tokens
pickle tokens trending
```

## Terminal UI (TUI)

Launch the interactive terminal dashboard for a full-screen trading experience:

```bash
pickle terminal    # Launch TUI dashboard
pickle tui         # Alias for terminal
```

The TUI provides:
- Real-time portfolio overview with balance and positions
- Live price charts and market data
- Token watchlist with price updates
- Position management interface
- Keyboard navigation (Tab to switch panels, q to quit)

## Commands

### Wallet

```bash
pickle wallet setup       # Create or import a wallet
pickle wallet show        # Display wallet address
pickle wallet balance     # Check XLM and token balances
pickle wallet export      # Export private key
```

### Tokens

```bash
pickle tokens list              # List all available tokens
pickle tokens trending          # Show trending tokens by volume
pickle tokens search <query>    # Search tokens by name or symbol
pickle tokens info <address>    # Get detailed token information
```

### Trading

```bash
pickle trade buy <token> <amount>     # Buy tokens with XLM
pickle trade sell <token> <amount>    # Sell tokens for XLM
pickle trade quote <token> <amount>   # Get price quote
```

### Perpetuals

```bash
pickle perp open <token>        # Open a leveraged position
pickle perp close <positionId>  # Close a position
pickle perp list                # List all open positions
pickle perp pnl                 # View profit and loss
```

Options for opening positions:
- `-s, --side <side>` - Position side: long or short (default: long)
- `-m, --margin <amount>` - Margin amount in XLM
- `-l, --leverage <number>` - Leverage multiplier (1-100)

Example:
```bash
pickle perp open 0x123...abc --side long --margin 1 --leverage 10
```

### Real World Assets (RWA)

```bash
pickle rwa list                 # List available RWA assets
pickle rwa open <asset>         # Open RWA position
pickle rwa close <positionId>   # Close RWA position
pickle rwa positions            # View RWA positions
```

Available RWA assets:
- Gold (XAU/USD)
- Silver (XAG/USD)
- Crude Oil (WTI)
- Bitcoin (BTC/USD)
- Ethereum (ETH/USD)
- Solana (SOL/USD)

### Portfolio

```bash
pickle portfolio      # View holdings and positions
pickle leaderboard    # Top traders by PnL
pickle history        # Transaction history
```

### Configuration

```bash
pickle config show              # View current configuration
pickle config set <key> <value> # Update configuration
pickle config reset             # Reset to defaults
```

Configuration options:
- `network` - Network to use (testnet or mainnet)
- `defaultSlippage` - Default slippage percentage (0-50)
- `rpcUrl` - Custom RPC URL
- `subgraphUrl` - Custom subgraph URL

### Terminal

```bash
pickle terminal    # Launch interactive TUI dashboard
pickle tui         # Alias for terminal command
```

## Wallet Security

Your private key is encrypted with AES-256-GCM and stored locally at `~/.pickle/keystore.json`. A password is required for every transaction.

Wallet options during setup:
- Generate a new wallet with recovery phrase
- Import an existing private key
- Import from mnemonic phrase

## Network

Pickle Perps CLI operates on Stellar Testnet testnet by default. You can switch networks using:

```bash
pickle config set network mainnet
```

## Environment Variables

- `PICKLEPERPS_SUBGRAPH_URL` - Override the default subgraph endpoint

## Requirements

- Node.js 18.0.0 or higher

## License

MIT
