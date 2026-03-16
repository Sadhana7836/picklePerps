import { isAddress, parseEther, formatEther } from 'viem';
import { getPublicClient, contracts, getTokenBalance, getNativeBalance } from './client.js';
import { isWalletConfigured, getWalletAddress } from './wallet.js';
// Validate Ethereum address
export function validateAddress(address) {
    if (!address) {
        return { valid: false, error: 'Address is required' };
    }
    if (!isAddress(address)) {
        return { valid: false, error: 'Invalid Ethereum address format' };
    }
    return { valid: true };
}
// Validate amount (must be positive number)
export function validateAmount(amount) {
    if (!amount || amount.trim() === '') {
        return { valid: false, error: 'Amount is required' };
    }
    const num = parseFloat(amount);
    if (isNaN(num)) {
        return { valid: false, error: 'Amount must be a valid number' };
    }
    if (num <= 0) {
        return { valid: false, error: 'Amount must be greater than 0' };
    }
    if (num > 1e18) {
        return { valid: false, error: 'Amount is too large' };
    }
    // Check for reasonable decimal places
    const decimals = amount.split('.')[1];
    if (decimals && decimals.length > 18) {
        return { valid: false, error: 'Too many decimal places (max 18)' };
    }
    return { valid: true };
}
// Validate leverage (1-100)
export function validateLeverage(leverage) {
    if (!Number.isInteger(leverage)) {
        return { valid: false, error: 'Leverage must be a whole number' };
    }
    if (leverage < 1) {
        return { valid: false, error: 'Leverage must be at least 1x' };
    }
    if (leverage > 100) {
        return { valid: false, error: 'Leverage cannot exceed 100x' };
    }
    return { valid: true };
}
// Validate password
export function validatePassword(password) {
    if (!password) {
        return { valid: false, error: 'Password is required' };
    }
    if (password.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters' };
    }
    return { valid: true };
}
// Check if wallet is ready for transactions
export function validateWalletReady() {
    if (!isWalletConfigured()) {
        return { valid: false, error: 'No wallet configured. Press 5 to set up a wallet.' };
    }
    const address = getWalletAddress();
    if (!address) {
        return { valid: false, error: 'Could not load wallet address' };
    }
    return { valid: true };
}
// Bonding curve market ABI for validation
const bondingCurveValidationABI = [
    {
        inputs: [{ name: 'token', type: 'address' }],
        name: 'isListed',
        outputs: [{ type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
];
// Check if token is listed on bonding curve
export async function validateTokenListed(tokenAddress) {
    const addressCheck = validateAddress(tokenAddress);
    if (!addressCheck.valid)
        return addressCheck;
    try {
        const client = getPublicClient();
        const isListed = await client.readContract({
            address: contracts.bondingCurveMarket,
            abi: bondingCurveValidationABI,
            functionName: 'isListed',
            args: [tokenAddress],
        });
        if (!isListed) {
            return { valid: false, error: 'Token is not listed on bonding curve' };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: 'Failed to check token listing status' };
    }
}
// Check if user has sufficient MNT balance for buy
export async function validateBuyBalance(walletAddress, ethAmount) {
    const amountCheck = validateAmount(ethAmount);
    if (!amountCheck.valid)
        return amountCheck;
    try {
        const balance = await getNativeBalance(walletAddress);
        const amountWei = parseEther(ethAmount);
        // Add buffer for gas (0.01 MNT)
        const gasBuffer = parseEther('0.01');
        const totalRequired = amountWei + gasBuffer;
        if (balance < totalRequired) {
            const balanceFormatted = parseFloat(formatEther(balance)).toFixed(4);
            const requiredFormatted = parseFloat(formatEther(totalRequired)).toFixed(4);
            return {
                valid: false,
                error: `Insufficient MNT balance. Have: ${balanceFormatted}, Need: ${requiredFormatted} (including gas)`,
            };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: 'Failed to check MNT balance' };
    }
}
// Check if user has sufficient token balance for sell
export async function validateSellBalance(tokenAddress, walletAddress, tokenAmount) {
    const amountCheck = validateAmount(tokenAmount);
    if (!amountCheck.valid)
        return amountCheck;
    try {
        const balance = await getTokenBalance(tokenAddress, walletAddress);
        const amountWei = parseEther(tokenAmount);
        if (balance < amountWei) {
            const balanceFormatted = parseFloat(formatEther(balance)).toFixed(4);
            return {
                valid: false,
                error: `Insufficient token balance. Have: ${balanceFormatted}, Need: ${tokenAmount}`,
            };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: 'Failed to check token balance' };
    }
}
// Check if user has sufficient MNT for margin
export async function validateMarginBalance(walletAddress, marginAmount) {
    return validateBuyBalance(walletAddress, marginAmount);
}
// Comprehensive buy validation
export async function validateBuyTransaction(tokenAddress, ethAmount) {
    // Check wallet
    const walletCheck = validateWalletReady();
    if (!walletCheck.valid)
        return walletCheck;
    // Check amount
    const amountCheck = validateAmount(ethAmount);
    if (!amountCheck.valid)
        return amountCheck;
    // Check token listing
    const listingCheck = await validateTokenListed(tokenAddress);
    if (!listingCheck.valid)
        return listingCheck;
    // Check balance
    const walletAddress = getWalletAddress();
    const balanceCheck = await validateBuyBalance(walletAddress, ethAmount);
    if (!balanceCheck.valid)
        return balanceCheck;
    return { valid: true };
}
// Comprehensive sell validation
export async function validateSellTransaction(tokenAddress, tokenAmount) {
    // Check wallet
    const walletCheck = validateWalletReady();
    if (!walletCheck.valid)
        return walletCheck;
    // Check amount
    const amountCheck = validateAmount(tokenAmount);
    if (!amountCheck.valid)
        return amountCheck;
    // Check token listing
    const listingCheck = await validateTokenListed(tokenAddress);
    if (!listingCheck.valid)
        return listingCheck;
    // Check token balance
    const walletAddress = getWalletAddress();
    const balanceCheck = await validateSellBalance(tokenAddress, walletAddress, tokenAmount);
    if (!balanceCheck.valid)
        return balanceCheck;
    return { valid: true };
}
// Comprehensive position validation
export async function validateOpenPosition(tokenAddress, marginAmount, leverage) {
    // Check wallet
    const walletCheck = validateWalletReady();
    if (!walletCheck.valid)
        return walletCheck;
    // Check margin amount
    const amountCheck = validateAmount(marginAmount);
    if (!amountCheck.valid)
        return amountCheck;
    // Check leverage
    const leverageCheck = validateLeverage(leverage);
    if (!leverageCheck.valid)
        return leverageCheck;
    // Check address
    const addressCheck = validateAddress(tokenAddress);
    if (!addressCheck.valid)
        return addressCheck;
    // Check margin balance
    const walletAddress = getWalletAddress();
    const balanceCheck = await validateMarginBalance(walletAddress, marginAmount);
    if (!balanceCheck.valid)
        return balanceCheck;
    return { valid: true };
}
// Parse blockchain error to user-friendly message
export function parseBlockchainError(error) {
    const message = error instanceof Error ? error.message : String(error);
    // Common error patterns
    if (message.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
    }
    if (message.includes('user rejected')) {
        return 'Transaction was cancelled';
    }
    if (message.includes('nonce too low')) {
        return 'Transaction conflict. Please try again.';
    }
    if (message.includes('gas required exceeds')) {
        return 'Transaction would fail. Check your inputs.';
    }
    if (message.includes('execution reverted')) {
        // Try to extract revert reason
        const revertMatch = message.match(/reason="([^"]+)"/);
        if (revertMatch) {
            return `Contract error: ${revertMatch[1]}`;
        }
        return 'Transaction would fail. The contract rejected it.';
    }
    if (message.includes('network') || message.includes('timeout')) {
        return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('Incorrect password')) {
        return 'Incorrect wallet password';
    }
    // Truncate long messages
    if (message.length > 100) {
        return message.substring(0, 100) + '...';
    }
    return message;
}
// Retry wrapper for network calls
export async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry user errors
            if (lastError.message.includes('Incorrect password') ||
                lastError.message.includes('user rejected')) {
                throw lastError;
            }
            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    }
    throw lastError;
}
// Calculate slippage with validation
export function calculateSlippage(amount, slippagePercent = 1) {
    if (slippagePercent < 0 || slippagePercent > 50) {
        throw new Error('Slippage must be between 0 and 50%');
    }
    // Calculate minimum acceptable amount (amount - slippage%)
    const slippageBps = BigInt(Math.floor(slippagePercent * 100)); // Convert to basis points
    const slippageAmount = (amount * slippageBps) / 10000n;
    return amount - slippageAmount;
}
//# sourceMappingURL=validation.js.map