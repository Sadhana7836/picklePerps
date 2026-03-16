import { Command } from 'commander';
import { formatEther } from 'viem';
import {
  printSection,
  printError,
  printKeyValue,
  createTable,
  createSpinner,
  styled,
  formatPrice,
  formatTokenAmount,
  formatAddress,
  newLine,
} from '../lib/ui.js';
import { isWalletConfigured, getWalletAddress } from '../lib/wallet.js';
import { getNativeBalance, getTokenInfo, getTokenBalance } from '../lib/client.js';
import { getAllUserPositions, getPositionPnL, getCurrentPrice } from '../lib/contracts.js';
import { fetchPortfolio, fetchTokens } from '../lib/subgraph.js';

export const portfolioCommand = new Command('portfolio')
  .description('View your portfolio (holdings + positions)')
  .action(async () => {
    try {
      // Check wallet
      if (!isWalletConfigured()) {
        printError('No wallet configured', 'Run "pickle wallet setup" first');
        process.exit(1);
      }

      const walletAddress = getWalletAddress()!;

      const spinner = createSpinner('Loading portfolio...').start();

      // Get native balance
      const nativeBalance = await getNativeBalance(walletAddress);

      // Try to get portfolio from subgraph
      let holdings: Array<{
        token: string;
        symbol: string;
        name: string;
        balance: string;
        price: number;
        value: number;
      }> = [];

      try {
        // Get all tokens and check balances
        const tokens = await fetchTokens(100);

        for (const token of tokens) {
          try {
            const balance = await getTokenBalance(token.address, walletAddress);
            if (balance > 0n) {
              const price = parseFloat(token.currentPrice) / 1e8;
              const balanceNum = Number(formatEther(balance));
              holdings.push({
                token: token.address,
                symbol: token.symbol,
                name: token.name,
                balance: formatEther(balance),
                price,
                value: balanceNum * price,
              });
            }
          } catch {
            // Skip tokens that fail
          }
        }
      } catch {
        // Subgraph not available, try direct approach
        spinner.text = 'Subgraph unavailable, using on-chain data...';
      }

      // Get positions
      const positions = await getAllUserPositions(walletAddress);

      spinner.succeed('Portfolio loaded');

      // Display Native Balance
      printSection('Wallet');
      printKeyValue('Address', styled.secondary(formatAddress(walletAddress)));
      printKeyValue('XLM Balance', styled.primary(formatEther(nativeBalance) + ' XLM'));

      // Display Holdings
      newLine();
      printSection('Token Holdings');

      if (holdings.length === 0) {
        console.log(styled.muted('  No token holdings'));
      } else {
        const holdingsTable = createTable(['Token', 'Balance', 'Price', 'Value']);

        let totalHoldingsValue = 0;

        for (const holding of holdings) {
          totalHoldingsValue += holding.value;

          holdingsTable.push([
            styled.bold(holding.symbol),
            formatTokenAmount(holding.balance),
            formatPrice(holding.price),
            `$${holding.value.toFixed(4)}`,
          ]);
        }

        console.log(holdingsTable.toString());
        newLine();
        printKeyValue('Total Holdings Value', styled.primary(`$${totalHoldingsValue.toFixed(4)}`));
      }

      // Display Positions
      newLine();
      printSection('Open Positions');

      if (positions.length === 0) {
        console.log(styled.muted('  No open positions'));
      } else {
        const positionsTable = createTable(['ID', 'Token', 'Side', 'Size', 'Leverage', 'PnL']);

        let totalPositionsPnl = 0n;
        let totalPositionsPnlIsProfit = true;

        for (const pos of positions) {
          // Get token symbol
          let tokenSymbol = formatAddress(pos.token);
          try {
            const tokenInfo = await getTokenInfo(pos.token);
            tokenSymbol = tokenInfo.symbol;
          } catch {
            // Keep address
          }

          // Get PnL
          const { pnl, isProfit } = await getPositionPnL(pos.positionId);

          if (isProfit) {
            totalPositionsPnl += pnl;
          } else {
            totalPositionsPnl -= pnl;
          }

          const pnlStr = styled.pnl(formatEther(pnl) + ' XLM', isProfit);

          positionsTable.push([
            pos.positionId.toString(),
            tokenSymbol,
            pos.isLong ? styled.long('LONG') : styled.short('SHORT'),
            pos.size + ' XLM',
            `${pos.leverage}x`,
            pnlStr,
          ]);
        }

        console.log(positionsTable.toString());
        newLine();

        totalPositionsPnlIsProfit = totalPositionsPnl >= 0n;
        const displayPnl = totalPositionsPnlIsProfit ? totalPositionsPnl : -totalPositionsPnl;

        printKeyValue(
          'Total Unrealized PnL',
          styled.pnl(formatEther(displayPnl) + ' XLM', totalPositionsPnlIsProfit)
        );
      }

      // Summary
      newLine();
      printSection('Summary');
      printKeyValue('Token Holdings', holdings.length.toString());
      printKeyValue('Open Positions', positions.length.toString());
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

export default portfolioCommand;
