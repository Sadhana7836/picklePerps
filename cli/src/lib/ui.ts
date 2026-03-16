import chalk from 'chalk';
import boxen from 'boxen';
import ora, { type Ora } from 'ora';
import Table from 'cli-table3';
import figlet from 'figlet';

// Color theme - Green primary
export const colors = {
  primary: '#00d26a',
  secondary: '#00d26a',
  success: '#00d26a',
  error: '#ff4757',
  warning: '#ffc107',
  muted: '#888888',
  dim: '#444444',
  long: '#00d26a',
  short: '#ff4757',
};

// Styled text helpers
export const styled = {
  primary: (text: string) => chalk.hex(colors.primary)(text),
  secondary: (text: string) => chalk.hex(colors.secondary)(text),
  success: (text: string) => chalk.hex(colors.success)(text),
  error: (text: string) => chalk.hex(colors.error)(text),
  warning: (text: string) => chalk.hex(colors.warning)(text),
  muted: (text: string) => chalk.hex(colors.muted)(text),
  dim: (text: string) => chalk.hex(colors.dim)(text),
  bold: (text: string) => chalk.bold(text),
  long: (text: string) => chalk.hex(colors.long).bold(text),
  short: (text: string) => chalk.hex(colors.short).bold(text),
  price: (value: string | number, isPositive?: boolean) => {
    if (isPositive === undefined) return chalk.white(value);
    return isPositive ? chalk.hex(colors.success)(value) : chalk.hex(colors.error)(value);
  },
  pnl: (value: string, isProfit: boolean) => {
    const prefix = isProfit ? '+' : '';
    return isProfit
      ? chalk.hex(colors.success)(`${prefix}${value}`)
      : chalk.hex(colors.error)(value);
  },
};

// Print the Pickle Perps header with ASCII art
export function printHeader(): void {
  const green = chalk.hex(colors.primary).bold;

  // Blocky pixel-style ASCII art like Veilocity
  console.log(green('█████╗ ██╗██╗  ██╗███████╗  ██████╗ ███████╗██████╗ ██████╗ ███████╗'));
  console.log(green('██╔══██╗██║██║ ██╔╝██╔════╝  ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝'));
  console.log(green('██████╔╝██║█████╔╝ █████╗    ██████╔╝█████╗  ██████╔╝██████╔╝███████╗'));
  console.log(green('██╔═══╝ ██║██╔═██╗ ██╔══╝    ██╔═══╝ ██╔══╝  ██╔══██╗██╔═══╝ ╚════██║'));
  console.log(green('██║     ██║██║  ██╗███████╗  ██║     ███████╗██║  ██║██║     ███████║'));
  console.log(green('╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝'));
  console.log();
  console.log('Trade Tokens & Real World Assets on Stellar');
  console.log();
}

// Print commands help menu
export function printCommandsHelp(): void {
  const green = chalk.hex(colors.primary);
  const bold = chalk.bold;
  const dim = chalk.dim;

  // Usage
  console.log(chalk.underline('Usage:') + ' pickle [OPTIONS] <COMMAND>');
  console.log();

  // Commands
  console.log(chalk.underline('Commands:'));
  console.log(`  ${green('wallet')}       Setup, view balance, or export wallet`);
  console.log(`  ${green('tokens')}       Browse and search available tokens`);
  console.log(`  ${green('trade')}        Buy or sell tokens on bonding curve`);
  console.log(`  ${green('perp')}         Open/close leveraged perpetual positions`);
  console.log(`  ${green('rwa')}          Trade Real World Assets (Gold, Oil, etc)`);
  console.log(`  ${green('portfolio')}    View holdings and positions`);
  console.log(`  ${green('leaderboard')}  Top traders by PnL`);
  console.log(`  ${green('config')}       View or update configuration`);
  console.log(`  ${green('terminal')}     Launch interactive TUI dashboard`);
  console.log(`  ${green('help')}         Print this message or help for subcommands`);
  console.log();

  // Options
  console.log(chalk.underline('Options:'));
  console.log(`  ${dim('-h, --help')}        Print help`);
  console.log(`  ${dim('-V, --version')}     Print version`);
  console.log(`  ${dim('--json')}            Output as JSON`);
  console.log();

  // Examples
  console.log(chalk.underline('Examples:'));
  console.log(`  pickle wallet setup              Create a new wallet`);
  console.log(`  pickle tokens trending           View trending tokens`);
  console.log(`  pickle trade buy <token> 0.1     Buy tokens with 0.1 XLM`);
  console.log(`  pickle perp open <token> -l 10   Open 10x leveraged position`);
  console.log(`  pickle rwa list                  List RWA assets`);
  console.log(`  pickle terminal                  Launch interactive TUI`);
  console.log(`  pickle tui                       Launch interactive TUI (alias)`);
  console.log();
}

// Print a section header
export function printSection(title: string): void {
  console.log();
  console.log(chalk.hex(colors.primary).bold(`  ${title}`));
  console.log(chalk.hex(colors.dim)('  ' + '─'.repeat(40)));
}

// Print success message
export function printSuccess(message: string): void {
  console.log(chalk.hex(colors.success)('✔ ') + message);
}

// Print error message
export function printError(message: string, suggestion?: string): void {
  console.log(chalk.hex(colors.error)('✖ ') + chalk.hex(colors.error)(message));
  if (suggestion) {
    console.log(chalk.hex(colors.warning)('  Suggestion: ') + suggestion);
  }
}

// Print warning message
export function printWarning(message: string): void {
  console.log(chalk.hex(colors.warning)('⚠ ') + message);
}

// Print info message
export function printInfo(message: string): void {
  console.log(chalk.hex(colors.secondary)('ℹ ') + message);
}

// Create a spinner
export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: 'green',
    spinner: 'dots',
  });
}

// Create a styled table
export function createTable(headers: string[]): Table.Table {
  return new Table({
    head: headers.map(h => chalk.hex(colors.muted)(h)),
    style: {
      head: [],
      border: ['gray'],
    },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    }
  });
}

// Progress bar for curve progress
export function progressBar(percent: number, width: number = 10): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = chalk.hex(colors.primary)('█'.repeat(filled)) +
              chalk.hex(colors.dim)('░'.repeat(empty));
  const percentStr = chalk.hex(colors.muted)(`${percent.toFixed(0)}%`);
  return `${bar} ${percentStr}`;
}

// Format price with dollar sign
export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (num === 0) return styled.muted('$0.00');
  if (num < 0.000001) return `$${num.toExponential(2)}`;
  if (num < 0.01) return `$${num.toFixed(8)}`;
  if (num < 1) return `$${num.toFixed(6)}`;
  if (num < 1000) return `$${num.toFixed(4)}`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// Format large numbers (market cap, volume)
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

// Format token amount
export function formatTokenAmount(amount: string | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) / 1e18 : parseFloat(amount);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// Format ETH/XLM amount
export function formatEth(amount: string | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) / 1e18 : parseFloat(amount);
  return `${num.toFixed(4)} XLM`;
}

// Format address (truncated)
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format timestamp to relative time
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Print key-value pair
export function printKeyValue(key: string, value: string, indent: number = 2): void {
  const padding = ' '.repeat(indent);
  console.log(`${padding}${chalk.hex(colors.muted)(key)}: ${value}`);
}

// Print transaction details with hash and explorer link
export function printTxLink(hash: string): void {
  const url = `https://explorer.sepolia.mantle.xyz/tx/${hash}`;
  console.log();
  console.log(styled.primary('  Transaction Hash:'));
  console.log(styled.muted(`  ${hash}`));
  console.log();
  console.log(styled.primary('  Explorer Link:'));
  console.log(chalk.hex(colors.primary).underline(`  ${url}`));
}

// Print a divider line
export function printDivider(): void {
  console.log(chalk.hex(colors.dim)('─'.repeat(50)));
}

// Clear line and print (for updating spinner text)
export function updateLine(text: string): void {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(text);
}

// Print empty line
export function newLine(): void {
  console.log();
}

// Print JSON output (for --json flag)
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
