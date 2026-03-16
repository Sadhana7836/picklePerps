import { scryptSync, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import HDKey from 'hdkey';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import type { Keystore, Config } from '../types.js';

// Config directory
const CONFIG_DIR = join(homedir(), '.pickle');
const KEYSTORE_PATH = join(CONFIG_DIR, 'keystore.json');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

// Ensure config directory exists
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

// Generate a new wallet with mnemonic
export function generateNewWallet(): { privateKey: string; address: string; mnemonic: string } {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed);
  const derivedKey = hdkey.derive("m/44'/60'/0'/0/0");
  const privateKey = `0x${derivedKey.privateKey!.toString('hex')}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return {
    privateKey,
    address: account.address,
    mnemonic,
  };
}

// Derive wallet from mnemonic
export function walletFromMnemonic(mnemonic: string): { privateKey: string; address: string } {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const seed = mnemonicToSeedSync(mnemonic);
  const hdkey = HDKey.fromMasterSeed(seed);
  const derivedKey = hdkey.derive("m/44'/60'/0'/0/0");
  const privateKey = `0x${derivedKey.privateKey!.toString('hex')}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  return {
    privateKey,
    address: account.address,
  };
}

// Validate private key format
export function validatePrivateKey(key: string): boolean {
  const hexKey = key.startsWith('0x') ? key.slice(2) : key;
  return /^[0-9a-fA-F]{64}$/.test(hexKey);
}

// Get account from private key
export function accountFromPrivateKey(privateKey: string): { privateKey: string; address: string } {
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  if (!validatePrivateKey(formattedKey)) {
    throw new Error('Invalid private key format');
  }

  const account = privateKeyToAccount(formattedKey as `0x${string}`);
  return {
    privateKey: formattedKey,
    address: account.address,
  };
}

// Encrypt and save private key to keystore
export function saveWallet(privateKey: string, password: string): void {
  ensureConfigDir();

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  // Generate encryption parameters
  const salt = randomBytes(32);
  const iv = randomBytes(16);

  // Derive key from password using scrypt (N: 2^14 = 16384, standard for keystores)
  const key = scryptSync(password, salt, 32, { N: 2 ** 14, r: 8, p: 1 });

  // Encrypt private key
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final()
  ]);

  const keystore: Keystore = {
    version: 1,
    address: account.address,
    cipher: 'aes-256-gcm',
    ciphertext: ciphertext.toString('hex'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };

  writeFileSync(KEYSTORE_PATH, JSON.stringify(keystore, null, 2));
  chmodSync(KEYSTORE_PATH, 0o600); // Owner read/write only
}

// Load and decrypt private key from keystore
export function loadPrivateKey(password: string): string {
  if (!existsSync(KEYSTORE_PATH)) {
    throw new Error('No wallet configured. Run "pickle wallet setup" first.');
  }

  const keystore: Keystore = JSON.parse(readFileSync(KEYSTORE_PATH, 'utf8'));

  const salt = Buffer.from(keystore.salt, 'hex');
  const iv = Buffer.from(keystore.iv, 'hex');
  const authTag = Buffer.from(keystore.authTag, 'hex');
  const ciphertext = Buffer.from(keystore.ciphertext, 'hex');

  // Derive key from password
  const key = scryptSync(password, salt, 32, { N: 2 ** 14, r: 8, p: 1 });

  // Decrypt
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    const privateKey = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]).toString('utf8');

    return privateKey;
  } catch {
    throw new Error('Incorrect password');
  }
}

// Get wallet account (requires password)
export function getWalletAccount(password: string): PrivateKeyAccount {
  const privateKey = loadPrivateKey(password);
  return privateKeyToAccount(privateKey as `0x${string}`);
}

// Get wallet address (no password required)
export function getWalletAddress(): string | null {
  if (!existsSync(KEYSTORE_PATH)) {
    return null;
  }

  const keystore: Keystore = JSON.parse(readFileSync(KEYSTORE_PATH, 'utf8'));
  return keystore.address;
}

// Check if wallet is configured
export function isWalletConfigured(): boolean {
  return existsSync(KEYSTORE_PATH);
}

// Delete wallet
export function deleteWallet(): void {
  if (existsSync(KEYSTORE_PATH)) {
    writeFileSync(KEYSTORE_PATH, ''); // Overwrite with empty before delete
    unlinkSync(KEYSTORE_PATH);
  }
}

// Config management
export function getConfig(): Config {
  ensureConfigDir();

  if (!existsSync(CONFIG_PATH)) {
    const defaultConfig: Config = {
      network: 'testnet',
      defaultSlippage: 1,
    };
    saveConfig(defaultConfig);
    return defaultConfig;
  }

  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function updateConfig(updates: Partial<Config>): Config {
  const current = getConfig();
  const updated = { ...current, ...updates };
  saveConfig(updated);
  return updated;
}

// Export paths for use in other modules
export const paths = {
  configDir: CONFIG_DIR,
  keystore: KEYSTORE_PATH,
  config: CONFIG_PATH,
};
