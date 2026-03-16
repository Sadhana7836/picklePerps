#!/usr/bin/env node

import { program } from 'commander';
import { printHeader, printCommandsHelp } from './lib/ui.js';

// Import commands
import walletCommand from './commands/wallet.js';
import tokensCommand from './commands/tokens.js';
import tradeCommand from './commands/trade.js';
import perpCommand from './commands/perp.js';
import portfolioCommand from './commands/portfolio.js';
import historyCommand from './commands/history.js';
import leaderboardCommand from './commands/leaderboard.js';
import configCommand from './commands/config.js';
import rwaCommand from './commands/rwa.js';

// Check if no args or just help flag
const args = process.argv.slice(2);

// Handle "terminal" command to launch TUI
if (args[0] === 'terminal' || args[0] === 'tui') {
  // Dynamically import and run TUI
  import('./tui/index.js').catch((err) => {
    console.error('Failed to load TUI:', err.message);
    process.exit(1);
  });
} else {

// Always print header
printHeader();

// Show custom help if no command provided
if (args.length === 0) {
  printCommandsHelp();
  process.exit(0);
}

// Setup program
program
  .name('pickle')
  .description('Pickle Perps Trading Terminal - Trade meme tokens from the command line')
  .version('1.0.0')
  .configureHelp({
    sortSubcommands: false,
  });

// Register commands
program.addCommand(walletCommand);
program.addCommand(tokensCommand);
program.addCommand(tradeCommand);
program.addCommand(perpCommand);
program.addCommand(portfolioCommand);
program.addCommand(historyCommand);
program.addCommand(leaderboardCommand);
program.addCommand(configCommand);
program.addCommand(rwaCommand);

// Global options
program
  .option('--json', 'Output as JSON')
  .option('--quiet', 'Minimal output');

// Custom help
program.on('--help', () => {
  printCommandsHelp();
});

// Parse arguments
program.parse();
}
