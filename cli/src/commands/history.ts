import { Command } from 'commander';
import {
  printSection,
  printError,
  createTable,
  createSpinner,
  styled,
  formatPrice,
  formatTokenAmount,
  formatAddress,
  formatTimeAgo,
  newLine,
} from '../lib/ui.js';
import { isWalletConfigured, getWalletAddress } from '../lib/wallet.js';
import { fetchTrades } from '../lib/subgraph.js';

export const historyCommand = new Command('history')
  .description('View your transaction history')
  .option('-l, --limit <number>', 'Number of transactions to show', '20')
  .option('-t, --token <address>', 'Filter by token address')
  .action(async (options) => {
    try {
      // Check wallet
      if (!isWalletConfigured()) {
        printError('No wallet configured', 'Run "pickle wallet setup" first');
        process.exit(1);
      }

      const walletAddress = getWalletAddress()!;
      const limit = parseInt(options.limit);

      const spinner = createSpinner('Fetching transaction history...').start();

      let trades;
      try {
        trades = await fetchTrades(options.token, limit);
        // Filter to user's trades only
        trades = trades.filter(t => t.trader.toLowerCase() === walletAddress.toLowerCase());
      } catch {
        spinner.fail('Could not fetch history');
        printError('Subgraph not available', 'Set PICKLEPERPS_SUBGRAPH_URL environment variable');
        return;
      }

      spinner.succeed(`Found ${trades.length} transactions`);

      if (trades.length === 0) {
        console.log(styled.muted('  No transactions found'));
        return;
      }

      printSection('Transaction History');

      const table = createTable(['Type', 'Token', 'Amount', 'Price', 'Time', 'Tx']);

      for (const trade of trades) {
        const type = trade.isBuy
          ? styled.success('BUY')
          : styled.error('SELL');

        table.push([
          type,
          trade.tokenSymbol || formatAddress(trade.token),
          trade.isBuy
            ? `+${formatTokenAmount(trade.tokenAmount)}`
            : `-${formatTokenAmount(trade.tokenAmount)}`,
          formatPrice(parseFloat(trade.price) / 1e8),
          formatTimeAgo(trade.timestamp),
          formatAddress(trade.txHash),
        ]);
      }

      newLine();
      console.log(table.toString());
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

export default historyCommand;
