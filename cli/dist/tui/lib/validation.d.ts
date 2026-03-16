export interface ValidationResult {
    valid: boolean;
    error?: string;
}
export declare function validateAddress(address: string): ValidationResult;
export declare function validateAmount(amount: string): ValidationResult;
export declare function validateLeverage(leverage: number): ValidationResult;
export declare function validatePassword(password: string): ValidationResult;
export declare function validateWalletReady(): ValidationResult;
export declare function validateTokenListed(tokenAddress: string): Promise<ValidationResult>;
export declare function validateBuyBalance(walletAddress: string, ethAmount: string): Promise<ValidationResult>;
export declare function validateSellBalance(tokenAddress: string, walletAddress: string, tokenAmount: string): Promise<ValidationResult>;
export declare function validateMarginBalance(walletAddress: string, marginAmount: string): Promise<ValidationResult>;
export declare function validateBuyTransaction(tokenAddress: string, ethAmount: string): Promise<ValidationResult>;
export declare function validateSellTransaction(tokenAddress: string, tokenAmount: string): Promise<ValidationResult>;
export declare function validateOpenPosition(tokenAddress: string, marginAmount: string, leverage: number): Promise<ValidationResult>;
export declare function parseBlockchainError(error: unknown): string;
export declare function withRetry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
export declare function calculateSlippage(amount: bigint, slippagePercent?: number): bigint;
//# sourceMappingURL=validation.d.ts.map