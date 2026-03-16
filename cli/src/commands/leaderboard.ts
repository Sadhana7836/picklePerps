import { Command } from 'commander';
import chalk from 'chalk';
import {
  printSection,
  printError,
  createTable,
  createSpinner,
  styled,
  formatNumber,
  formatAddress,
  newLine,
} from '../lib/ui.js';
import { fetchLeaderboard } from '../lib/subgraph.js';

export const leaderboardCommand = new Command('leaderboard')
  .description('View top traders by PnL')
  .option('-l, --limit <number>', 'Number of traders to show', '10')
  .option('-p, --period <period>', 'Time period: daily, weekly, monthly, all-time', 'all-time')
  .action(async (options) => {
    try {
      const limit = parseInt(options.limit);
      const period = options.period;

      const spinner = createSpinner('Fetching leaderboard...').start();

      let leaders;
      try {
        leaders = await fetchLeaderboard(period, limit);
      } catch {
        spinner.fail('Could not fetch leaderboard');
        printError('Subgraph not available', 'Set PICKLEPERPS_SUBGRAPH_URL environment variable');
        return;
      }

      spinner.succeed(`Top ${leaders.length} traders`);

      if (leaders.length === 0) {
        console.log(styled.muted('  No traders found'));
        return;
      }

      printSection(`Leaderboard (${period})`);

      const table = createTable(['Rank', 'Trader', 'PnL', 'Volume', 'Trades', 'Win Rate']);

      for (let i = 0; i < leaders.length; i++) {
        const leader = leaders[i];
        const pnl = parseFloat(leader.pnl);
        const pnlStr = pnl >= 0
          ? chalk.green(`+${formatNumber(pnl)} XLM`)
          : chalk.red(`${formatNumber(pnl)} XLM`);

        // Rank with medal for top 3
        let rank = `${i + 1}`;
        if (i === 0) rank = chalk.yellow('🥇 1');
        else if (i === 1) rank = chalk.gray('🥈 2');
        else if (i === 2) rank = chalk.hex('#cd7f32')('🥉 3');

        table.push([
          rank,
          formatAddress(leader.user),
          pnlStr,
          formatNumber(parseFloat(leader.volume)) + ' XLM',
          leader.trades,
          `${leader.winRate}%`,
        ]);
      }

      newLine();
      console.log(table.toString());
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

export default leaderboardCommand;
