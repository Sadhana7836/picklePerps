import { Command } from 'commander';
import {
  printSection,
  printError,
  printSuccess,
  printKeyValue,
  styled,
  newLine,
} from '../lib/ui.js';
import { getConfig, updateConfig, paths } from '../lib/wallet.js';

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

// Show current config
configCommand
  .command('show')
  .description('Display current configuration')
  .action(async () => {
    try {
      const config = getConfig();

      printSection('Configuration');
      printKeyValue('Network', styled.primary(config.network));
      printKeyValue('Default Slippage', `${config.defaultSlippage}%`);

      if (config.rpcUrl) {
        printKeyValue('Custom RPC', config.rpcUrl);
      }

      if (config.subgraphUrl) {
        printKeyValue('Subgraph URL', config.subgraphUrl);
      }

      newLine();
      printKeyValue('Config File', styled.muted(paths.config));
      printKeyValue('Keystore', styled.muted(paths.keystore));
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

// Set config value
configCommand
  .command('set <key> <value>')
  .description('Update a configuration value')
  .action(async (key, value) => {
    try {
      const validKeys = ['network', 'defaultSlippage', 'rpcUrl', 'subgraphUrl'];

      if (!validKeys.includes(key)) {
        printError(`Invalid config key: ${key}`, `Valid keys: ${validKeys.join(', ')}`);
        process.exit(1);
      }

      let parsedValue: string | number = value;

      // Validate and parse values
      if (key === 'network') {
        if (value !== 'testnet' && value !== 'mainnet') {
          printError('Invalid network', 'Must be "testnet" or "mainnet"');
          process.exit(1);
        }
      }

      if (key === 'defaultSlippage') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 50) {
          printError('Invalid slippage', 'Must be a number between 0 and 50');
          process.exit(1);
        }
        parsedValue = num;
      }

      updateConfig({ [key]: parsedValue } as never);

      printSuccess(`Updated ${key} = ${value}`);
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

// Reset config to defaults
configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    try {
      updateConfig({
        network: 'testnet',
        defaultSlippage: 1,
        rpcUrl: undefined,
        subgraphUrl: undefined,
      });

      printSuccess('Configuration reset to defaults');
    } catch (error) {
      printError((error as Error).message);
      process.exit(1);
    }
  });

export default configCommand;
