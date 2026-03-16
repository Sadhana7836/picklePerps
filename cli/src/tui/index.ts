#!/usr/bin/env node

import { App } from './components/App.js';

// ASCII art banner
const BANNER = `
\x1b[32m██████╗ ██╗██╗  ██╗███████╗  ██████╗ ███████╗██████╗ ██████╗ ███████╗\x1b[0m
\x1b[32m██╔══██╗██║██║ ██╔╝██╔════╝  ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝\x1b[0m
\x1b[32m██████╔╝██║█████╔╝ █████╗    ██████╔╝█████╗  ██████╔╝██████╔╝███████╗\x1b[0m
\x1b[32m██╔═══╝ ██║██╔═██╗ ██╔══╝    ██╔═══╝ ██╔══╝  ██╔══██╗██╔═══╝ ╚════██║\x1b[0m
\x1b[32m██║     ██║██║  ██╗███████╗  ██║     ███████╗██║  ██║██║     ███████║\x1b[0m
\x1b[32m╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝\x1b[0m
  \x1b[90mTrade Meme Tokens & RWA on Stellar\x1b[0m
`;

// Check for help flag
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(BANNER);
  console.log(`
\x1b[4mUsage:\x1b[0m pickle-trade-terminal [options]

\x1b[4mOptions:\x1b[0m
  -h, --help     Show this help message
  -v, --version  Show version number

\x1b[4mKeybindings:\x1b[0m
  1-5            Navigate between views
  Tab            Focus next element
  Enter          Select/Confirm
  q              Quit
  r              Refresh data
  b              Buy token
  s              Sell token
  l              Open long position
  h              Open short position
  c              Close position (in Positions view)
  /              Search tokens

\x1b[4mViews:\x1b[0m
  1. Dashboard   - Token list and quick actions
  2. Trade       - Buy/Sell tokens
  3. Positions   - Manage perpetual positions
  4. Portfolio   - View holdings and PnL
  5. Wallet      - Manage your wallet

\x1b[4mGetting Started:\x1b[0m
  1. Press '5' to go to Wallet view
  2. Set up a wallet (generate or import)
  3. Press '1' to go to Dashboard
  4. Select a token and start trading!

\x1b[32mDocumentation:\x1b[0m https://pickle-perps.vercel.app/
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('pickle-trade-terminal v1.0.0');
  process.exit(0);
}

// Print banner and start the app
console.clear();
console.log(BANNER);
console.log('  Starting Pickle Perps Trade Terminal...\n');

// Small delay to show the banner
setTimeout(() => {
  try {
    const app = new App();
    app.run();
  } catch (error) {
    console.error('\x1b[31mError starting TUI:\x1b[0m', (error as Error).message);
    console.error('\nMake sure your terminal supports the blessed library.');
    process.exit(1);
  }
}, 500);
