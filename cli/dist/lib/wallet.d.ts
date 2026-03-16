import { type PrivateKeyAccount } from 'viem/accounts';
import type { Config } from '../types.js';
export declare function generateNewWallet(): {
    privateKey: string;
    address: string;
    mnemonic: string;
};
export declare function walletFromMnemonic(mnemonic: string): {
    privateKey: string;
    address: string;
};
export declare function validatePrivateKey(key: string): boolean;
export declare function accountFromPrivateKey(privateKey: string): {
    privateKey: string;
    address: string;
};
export declare function saveWallet(privateKey: string, password: string): void;
export declare function loadPrivateKey(password: string): string;
export declare function getWalletAccount(password: string): PrivateKeyAccount;
export declare function getWalletAddress(): string | null;
export declare function isWalletConfigured(): boolean;
export declare function deleteWallet(): void;
export declare function getConfig(): Config;
export declare function saveConfig(config: Config): void;
export declare function updateConfig(updates: Partial<Config>): Config;
export declare const paths: {
    configDir: string;
    keystore: string;
    config: string;
};
//# sourceMappingURL=wallet.d.ts.map