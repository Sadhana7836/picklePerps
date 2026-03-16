import inquirer from 'inquirer';
import chalk from 'chalk';
import { colors } from './ui.js';

// Password prompt (hidden input)
export async function promptPassword(message = 'Enter password'): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: chalk.hex(colors.muted)(message + ':'),
      mask: '*',
    },
  ]);
  return password;
}

// Confirm password (for setup)
export async function promptNewPassword(): Promise<string> {
  const { password, confirm } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: chalk.hex(colors.muted)('Set a password:'),
      mask: '*',
      validate: (input: string) => {
        if (input.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return true;
      },
    },
    {
      type: 'password',
      name: 'confirm',
      message: chalk.hex(colors.muted)('Confirm password:'),
      mask: '*',
    },
  ]);

  if (password !== confirm) {
    throw new Error('Passwords do not match');
  }

  return password;
}

// Confirmation prompt
export async function promptConfirm(message: string, defaultValue = false): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: chalk.hex(colors.muted)(message),
      default: defaultValue,
    },
  ]);
  return confirmed;
}

// Select prompt
export async function promptSelect<T extends string>(
  message: string,
  choices: Array<{ name: string; value: T; description?: string }>
): Promise<T> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: chalk.hex(colors.muted)(message),
      choices: choices.map(c => ({
        name: c.description ? `${c.name} - ${chalk.gray(c.description)}` : c.name,
        value: c.value,
      })),
    },
  ]);
  return selected;
}

// Text input prompt
export async function promptInput(
  message: string,
  options?: {
    default?: string;
    validate?: (input: string) => boolean | string;
  }
): Promise<string> {
  const { value } = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message: chalk.hex(colors.muted)(message + ':'),
      default: options?.default,
      validate: options?.validate,
    },
  ]);
  return value;
}

// Mnemonic input (multi-line friendly)
export async function promptMnemonic(): Promise<string> {
  const { mnemonic } = await inquirer.prompt([
    {
      type: 'password',
      name: 'mnemonic',
      message: chalk.hex(colors.muted)('Enter your mnemonic phrase (12 or 24 words):'),
      mask: '*',
      validate: (input: string) => {
        const words = input.trim().split(/\s+/);
        if (words.length !== 12 && words.length !== 24) {
          return 'Mnemonic must be 12 or 24 words';
        }
        return true;
      },
    },
  ]);
  return mnemonic.trim();
}

// Private key input
export async function promptPrivateKey(): Promise<string> {
  const { key } = await inquirer.prompt([
    {
      type: 'password',
      name: 'key',
      message: chalk.hex(colors.muted)('Enter your private key:'),
      mask: '*',
      validate: (input: string) => {
        const hex = input.startsWith('0x') ? input.slice(2) : input;
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
          return 'Invalid private key format (expected 64 hex characters)';
        }
        return true;
      },
    },
  ]);
  return key;
}

// Amount input with validation
export async function promptAmount(
  message: string,
  options?: {
    min?: number;
    max?: number;
  }
): Promise<string> {
  const { amount } = await inquirer.prompt([
    {
      type: 'input',
      name: 'amount',
      message: chalk.hex(colors.muted)(message + ':'),
      validate: (input: string) => {
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a valid positive number';
        }
        if (options?.min !== undefined && num < options.min) {
          return `Amount must be at least ${options.min}`;
        }
        if (options?.max !== undefined && num > options.max) {
          return `Amount must be at most ${options.max}`;
        }
        return true;
      },
    },
  ]);
  return amount;
}

// Leverage input
export async function promptLeverage(): Promise<number> {
  const { leverage } = await inquirer.prompt([
    {
      type: 'input',
      name: 'leverage',
      message: chalk.hex(colors.muted)('Enter leverage (1-100):'),
      default: '10',
      validate: (input: string) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 100) {
          return 'Leverage must be between 1 and 100';
        }
        return true;
      },
    },
  ]);
  return parseInt(leverage);
}

// Token address input
export async function promptTokenAddress(): Promise<string> {
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: chalk.hex(colors.muted)('Enter token address:'),
      validate: (input: string) => {
        if (!/^0x[0-9a-fA-F]{40}$/.test(input)) {
          return 'Invalid address format';
        }
        return true;
      },
    },
  ]);
  return address;
}
