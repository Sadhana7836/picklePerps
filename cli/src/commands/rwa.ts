import { Command } from 'commander';
import { formatEther } from 'viem';
import {
  printSection,
  printError,
  printSuccess,
  printKeyValue,
  printWarning,
  printTxLink,
  createTable,
  createSpinner,
  styled,
  formatPrice,
  formatAddress,
  newLine,
} from '../lib/ui.js';
import { isWalletConfigured, getWalletAddress } from '../lib/wallet.js';
import { getNativeBalance } from '../lib/client.js';
import { promptPassword, promptConfirm, promptLeverage, promptSelect } from '../lib/prompts.js';

// RWA Assets available for trading
const RWA_ASSETS = [
  { id: 'gold', name: 'Gold (XAU/USD)', symbol: 'XAU', pythId: '0xfe650f0367d4a7ef9815a593ea15d36593f0643aaaf0149bb04be67ab851decd' },
  { id: 'silver', name: 'Silver (XAG/USD)', symbol: 'XAG', pythId: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e' },
  { id: 'oil', name: 'Crude Oil (WTI)', symbol: 'OIL', pythId: '0xc7c60099c12805bea1ae4df2243d6fe72b63be3adeb2208195e844734219967b' },
  { id: 'btc', name: 'Bitcoin (BTC/USD)', symbol: 'BTC', pythId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' },
  { id: 'eth', name: 'Ethereum (ETH/USD)', symbol: 'ETH', pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' },
  { id: 'sol', name: 'Solana (SOL/USD)', symbol: 'SOL', pythId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' },
];

export const rwaCommand = new Command('rwa')
  .description('Trade Real World Assets (RWA) with leverage');

// List available RWA assets
rwaCommand
  .command('list')
  .description('List available RWA assets')
  .action(async () => {
    try {
      printSection('Available RWA Assets');

      const table = createTable(['Asset', 'Symbol', 'Name']);

      for (const asset of RWA_ASSETS) {
        table.push([
          styled.primary(asset.id),
          styled.bold(asset.symbol),
          asset.name,
        ]);
      }

      newLine();
      console.log(table.toString());
      newLine();
      console.log(styled.muted('  Use "pickle rwa open <asset>" to open a position'));
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

// Open RWA position
rwaCommand
  .command('open <asset>')
  .description('Open a leveraged RWA position')
  .option('-s, --side <side>', 'Position side: long or short', 'long')
  .option('-m, --margin <amount>', 'Margin amount in XLM')
  .option('-l, --leverage <number>', 'Leverage multiplier (1-100)')
  .action(async (assetId, options) => {
    try {
      // Check wallet
      if (!isWalletConfigured()) {
        printError('No wallet configured', 'Run "pickle wallet setup" first');
        process.exit(1);
      }

      const walletAddress = getWalletAddress()!;

      // Find asset
      const asset = RWA_ASSETS.find(a => a.id.toLowerCase() === assetId.toLowerCase());
      if (!asset) {
        printError(`Asset "${assetId}" not found`, `Available: ${RWA_ASSETS.map(a => a.id).join(', ')}`);
        process.exit(1);
      }

      const spinner = createSpinner('Checking asset...').start();
      spinner.succeed(`Asset found: ${asset.name}`);

      // Get position parameters
      let isLong: boolean;
      if (options.side) {
        isLong = options.side.toLowerCase() === 'long';
      } else {
        const side = await promptSelect<'long' | 'short'>('Position side', [
          { name: 'LONG', value: 'long', description: 'Profit when price goes up' },
          { name: 'SHORT', value: 'short', description: 'Profit when price goes down' },
        ]);
        isLong = side === 'long';
      }

      // Get margin
      let margin = options.margin;
      if (!margin) {
        const balance = await getNativeBalance(walletAddress);
        console.log(styled.muted(`  Available balance: ${formatEther(balance)} XLM`));

        const { amount } = await import('inquirer').then(m =>
          m.default.prompt([{
            type: 'input',
            name: 'amount',
            message: 'Margin amount (XLM):',
            validate: (input: string) => {
              const num = parseFloat(input);
              if (isNaN(num) || num <= 0) return 'Enter a valid amount';
              return true;
            },
          }])
        );
        margin = amount;
      }

      // Get leverage
      let leverage = options.leverage ? parseInt(options.leverage) : undefined;
      if (!leverage) {
        leverage = await promptLeverage();
      }

      const marginNum = parseFloat(margin);
      const positionSize = marginNum * leverage;

      // Check balance
      const balance = await getNativeBalance(walletAddress);
      const marginWei = BigInt(Math.floor(marginNum * 1e18));
      if (balance < marginWei) {
        printError('Insufficient balance', `You need ${margin} XLM but have ${formatEther(balance)} XLM`);
        process.exit(1);
      }

      // Display position details
      printSection('RWA Position Details');
      printKeyValue('Asset', `${asset.symbol} (${asset.name})`);
      printKeyValue('Side', isLong ? styled.long('LONG') : styled.short('SHORT'));
      printKeyValue('Margin', `${margin} XLM`);
      printKeyValue('Leverage', `${leverage}x`);
      printKeyValue('Position Size', `${positionSize.toFixed(2)} XLM`);
      newLine();

      // Confirm
      const confirmed = await promptConfirm('Open this RWA position?', false);
      if (!confirmed) {
        printWarning('Position cancelled');
        return;
      }

      // Get password
      const password = await promptPassword('Enter wallet password');

      // Open position (placeholder - would need RWA contract integration)
      const txSpinner = createSpinner('Opening RWA position...').start();

      // TODO: Integrate with RWAPerpetualTrading contract
      // For now, show a message that this feature is coming soon
      txSpinner.warn('RWA trading coming soon!');
      printWarning('RWA perpetual contract integration in progress');

    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

// Close RWA position
rwaCommand
  .command('close <positionId>')
  .description('Close an RWA position')
  .action(async (positionId) => {
    try {
      if (!isWalletConfigured()) {
        printError('No wallet configured', 'Run "pickle wallet setup" first');
        process.exit(1);
      }

      printWarning('RWA trading coming soon!');
      printWarning('RWA perpetual contract integration in progress');
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

// List RWA positions
rwaCommand
  .command('positions')
  .description('View your RWA positions')
  .action(async () => {
    try {
      if (!isWalletConfigured()) {
        printError('No wallet configured', 'Run "pickle wallet setup" first');
        process.exit(1);
      }

      printSection('RWA Positions');
      console.log(styled.muted('  No RWA positions found'));
      newLine();
      printWarning('RWA trading coming soon!');
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

export default rwaCommand;
