import { parseEther, formatEther, decodeEventLog } from 'viem';
import { getPublicClient, getWalletClient, contracts, mantleTestnet } from './client.js';
import { validateBuyTransaction, validateSellTransaction, validateOpenPosition, parseBlockchainError, calculateSlippage, } from './validation.js';
// Get the next nonce for transactions (handles pending txs)
async function getNextNonce(address) {
    const client = getPublicClient();
    const pendingNonce = await client.getTransactionCount({
        address,
        blockTag: 'pending',
    });
    return pendingNonce;
}
// Bonding Curve Market ABI (essential functions)
const bondingCurveMarketABI = [
    {
        inputs: [{ name: 'token', type: 'address' }, { name: 'ethAmount', type: 'uint256' }],
        name: 'getBuyQuote',
        outputs: [{ name: 'tokensOut', type: 'uint256' }, { name: 'avgPrice', type: 'uint256' }, { name: 'fee', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }, { name: 'tokenAmount', type: 'uint256' }],
        name: 'getSellQuote',
        outputs: [{ name: 'ethOut', type: 'uint256' }, { name: 'avgPrice', type: 'uint256' }, { name: 'fee', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }],
        name: 'getCurrentPrice',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }],
        name: 'isListed',
        outputs: [{ type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }],
        name: 'getCurveProgress',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }, { name: 'minTokensOut', type: 'uint256' }],
        name: 'buy',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }, { name: 'tokenAmount', type: 'uint256' }, { name: 'minEthOut', type: 'uint256' }],
        name: 'sell',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'token', type: 'address' },
            { indexed: true, name: 'buyer', type: 'address' },
            { indexed: false, name: 'ethAmount', type: 'uint256' },
            { indexed: false, name: 'tokensOut', type: 'uint256' },
            { indexed: false, name: 'price', type: 'uint256' },
        ],
        name: 'TokenBought',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'token', type: 'address' },
            { indexed: true, name: 'seller', type: 'address' },
            { indexed: false, name: 'tokenAmount', type: 'uint256' },
            { indexed: false, name: 'ethOut', type: 'uint256' },
            { indexed: false, name: 'price', type: 'uint256' },
        ],
        name: 'TokenSold',
        type: 'event',
    },
];
// Perpetual Trading ABI (essential functions)
const perpetualTradingABI = [
    {
        inputs: [{ name: 'token', type: 'address' }],
        name: 'getCurrentPrice',
        outputs: [{ name: 'price', type: 'uint256' }, { name: 'isValid', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'token', type: 'address' }, { name: 'price', type: 'uint256' }],
        name: 'updateMemeTokenPrice',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'isLong', type: 'bool' },
            { name: 'margin', type: 'uint256' },
            { name: 'leverage', type: 'uint256' },
        ],
        name: 'openPosition',
        outputs: [{ name: 'positionId', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ name: 'positionId', type: 'uint256' }],
        name: 'closePosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getUserPositions',
        outputs: [{ type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'positionId', type: 'uint256' }],
        name: 'getPosition',
        outputs: [{
                components: [
                    { name: 'user', type: 'address' },
                    { name: 'token', type: 'address' },
                    { name: 'isLong', type: 'bool' },
                    { name: 'size', type: 'uint256' },
                    { name: 'margin', type: 'uint256' },
                    { name: 'leverage', type: 'uint256' },
                    { name: 'entryPrice', type: 'uint256' },
                    { name: 'entryTime', type: 'uint256' },
                    { name: 'lastFundingTime', type: 'uint256' },
                    { name: 'isOpen', type: 'bool' },
                ],
                type: 'tuple',
            }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'positionId', type: 'uint256' }],
        name: 'getPositionPnL',
        outputs: [{ name: 'pnl', type: 'uint256' }, { name: 'isProfit', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'positionId', type: 'uint256' }],
        name: 'getLiquidationPrice',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'positionId', type: 'uint256' },
            { indexed: true, name: 'user', type: 'address' },
            { indexed: true, name: 'token', type: 'address' },
            { indexed: false, name: 'isLong', type: 'bool' },
            { indexed: false, name: 'size', type: 'uint256' },
            { indexed: false, name: 'margin', type: 'uint256' },
            { indexed: false, name: 'leverage', type: 'uint256' },
            { indexed: false, name: 'entryPrice', type: 'uint256' },
        ],
        name: 'PositionOpened',
        type: 'event',
    },
];
// ERC20 ABI for approvals
const erc20ABI = [
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
// ============ BONDING CURVE FUNCTIONS ============
// Get buy quote
export async function getBuyQuote(tokenAddress, ethAmount) {
    const client = getPublicClient();
    const amountWei = parseEther(ethAmount);
    const [tokensOut, avgPrice, fee] = (await client.readContract({
        address: contracts.bondingCurveMarket,
        abi: bondingCurveMarketABI,
        functionName: 'getBuyQuote',
        args: [tokenAddress, amountWei],
    }));
    // Calculate price impact (simplified)
    const currentPrice = await getCurrentPrice(tokenAddress);
    const priceImpact = currentPrice > 0n
        ? Number((avgPrice - currentPrice) * 10000n / currentPrice) / 100
        : 0;
    return {
        tokensOut,
        avgPrice,
        fee,
        priceImpact,
    };
}
// Get sell quote
export async function getSellQuote(tokenAddress, tokenAmount) {
    const client = getPublicClient();
    const amountWei = parseEther(tokenAmount);
    const [ethOut, avgPrice, fee] = (await client.readContract({
        address: contracts.bondingCurveMarket,
        abi: bondingCurveMarketABI,
        functionName: 'getSellQuote',
        args: [tokenAddress, amountWei],
    }));
    const currentPrice = await getCurrentPrice(tokenAddress);
    const priceImpact = currentPrice > 0n
        ? Number((currentPrice - avgPrice) * 10000n / currentPrice) / 100
        : 0;
    return {
        ethOut,
        avgPrice,
        fee,
        priceImpact,
    };
}
// Get current token price from bonding curve
export async function getCurrentPrice(tokenAddress) {
    const client = getPublicClient();
    try {
        const price = await client.readContract({
            address: contracts.bondingCurveMarket,
            abi: bondingCurveMarketABI,
            functionName: 'getCurrentPrice',
            args: [tokenAddress],
        });
        return price;
    }
    catch {
        return 0n;
    }
}
// Check if token is listed on bonding curve
export async function isTokenListed(tokenAddress) {
    const client = getPublicClient();
    try {
        const listed = await client.readContract({
            address: contracts.bondingCurveMarket,
            abi: bondingCurveMarketABI,
            functionName: 'isListed',
            args: [tokenAddress],
        });
        return listed;
    }
    catch {
        return false;
    }
}
// Get curve progress (0-10000 basis points)
export async function getCurveProgress(tokenAddress) {
    const client = getPublicClient();
    try {
        const progress = await client.readContract({
            address: contracts.bondingCurveMarket,
            abi: bondingCurveMarketABI,
            functionName: 'getCurveProgress',
            args: [tokenAddress],
        });
        return Number(progress) / 100; // Convert to percentage
    }
    catch {
        return 0;
    }
}
// Buy tokens on bonding curve
export async function buyTokens(tokenAddress, ethAmount, minTokensOut, password, slippagePercent = 1) {
    // Validate transaction before executing
    const validation = await validateBuyTransaction(tokenAddress, ethAmount);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    try {
        const walletClient = await getWalletClient(password);
        const publicClient = getPublicClient();
        const amountWei = parseEther(ethAmount);
        // Apply slippage to minimum tokens out
        const minTokensWithSlippage = calculateSlippage(minTokensOut, slippagePercent);
        // Get fresh nonce to avoid conflicts with pending transactions
        const nonce = await getNextNonce(walletClient.account.address);
        // Estimate gas first to check if transaction will succeed
        try {
            await publicClient.estimateContractGas({
                address: contracts.bondingCurveMarket,
                abi: bondingCurveMarketABI,
                functionName: 'buy',
                args: [tokenAddress, minTokensWithSlippage],
                value: amountWei,
                account: walletClient.account,
            });
        }
        catch (gasError) {
            throw new Error(`Transaction would fail: ${parseBlockchainError(gasError)}`);
        }
        // Execute buy with explicit nonce
        const hash = await walletClient.writeContract({
            account: walletClient.account,
            chain: mantleTestnet,
            address: contracts.bondingCurveMarket,
            abi: bondingCurveMarketABI,
            functionName: 'buy',
            args: [tokenAddress, minTokensWithSlippage],
            value: amountWei,
            nonce,
        });
        // Wait for confirmation and extract tokensOut from event
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000, // 60 second timeout
        });
        if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted on-chain');
        }
        let tokensReceived = 0n;
        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({
                    abi: bondingCurveMarketABI,
                    data: log.data,
                    topics: log.topics,
                });
                if (decoded.eventName === 'TokenBought') {
                    tokensReceived = decoded.args.tokensOut;
                    break;
                }
            }
            catch {
                // Not our event, continue
            }
        }
        return { hash, tokensReceived };
    }
    catch (error) {
        throw new Error(parseBlockchainError(error));
    }
}
// Sell tokens on bonding curve
export async function sellTokens(tokenAddress, tokenAmount, minEthOut, password, slippagePercent = 1) {
    // Validate transaction before executing
    const validation = await validateSellTransaction(tokenAddress, tokenAmount);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    try {
        const walletClient = await getWalletClient(password);
        const publicClient = getPublicClient();
        const amountWei = parseEther(tokenAmount);
        // Apply slippage to minimum ETH out
        const minEthWithSlippage = calculateSlippage(minEthOut, slippagePercent);
        // Check allowance and approve if needed
        const allowance = await publicClient.readContract({
            address: tokenAddress,
            abi: erc20ABI,
            functionName: 'allowance',
            args: [walletClient.account.address, contracts.bondingCurveMarket],
        });
        if (allowance < amountWei) {
            // Approve max uint256 to avoid future approvals
            const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
            const approveHash = await walletClient.writeContract({
                account: walletClient.account,
                chain: mantleTestnet,
                address: tokenAddress,
                abi: erc20ABI,
                functionName: 'approve',
                args: [contracts.bondingCurveMarket, maxApproval],
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash, timeout: 60_000 });
        }
        // Estimate gas first
        try {
            await publicClient.estimateContractGas({
                address: contracts.bondingCurveMarket,
                abi: bondingCurveMarketABI,
                functionName: 'sell',
                args: [tokenAddress, amountWei, minEthWithSlippage],
                account: walletClient.account,
            });
        }
        catch (gasError) {
            throw new Error(`Transaction would fail: ${parseBlockchainError(gasError)}`);
        }
        // Execute sell
        const hash = await walletClient.writeContract({
            account: walletClient.account,
            chain: mantleTestnet,
            address: contracts.bondingCurveMarket,
            abi: bondingCurveMarketABI,
            functionName: 'sell',
            args: [tokenAddress, amountWei, minEthWithSlippage],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000,
        });
        if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted on-chain');
        }
        let ethReceived = 0n;
        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({
                    abi: bondingCurveMarketABI,
                    data: log.data,
                    topics: log.topics,
                });
                if (decoded.eventName === 'TokenSold') {
                    ethReceived = decoded.args.ethOut;
                    break;
                }
            }
            catch {
                // Not our event, continue
            }
        }
        return { hash, ethReceived };
    }
    catch (error) {
        throw new Error(parseBlockchainError(error));
    }
}
// ============ PERPETUAL TRADING FUNCTIONS ============
// Default price for meme tokens
const DEFAULT_PRICE = BigInt(10000000); // $0.0001 * 1e8
// Get token price from perpetual contract
export async function getPerpetualPrice(tokenAddress) {
    const client = getPublicClient();
    try {
        const [price, isValid] = (await client.readContract({
            address: contracts.perpetualTrading,
            abi: perpetualTradingABI,
            functionName: 'getCurrentPrice',
            args: [tokenAddress],
        }));
        return { price, isValid };
    }
    catch {
        return { price: 0n, isValid: false };
    }
}
// Open perpetual position
export async function openPosition(tokenAddress, isLong, marginAmount, leverage, password) {
    // Validate position parameters
    const validation = await validateOpenPosition(tokenAddress, marginAmount, leverage);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    try {
        const walletClient = await getWalletClient(password);
        const publicClient = getPublicClient();
        const marginWei = parseEther(marginAmount);
        // Check if price is available, if not update it first
        const { isValid } = await getPerpetualPrice(tokenAddress);
        if (!isValid) {
            // Get price from bonding curve
            let bondingPrice = await getCurrentPrice(tokenAddress);
            // If no bonding curve price, use default price
            if (bondingPrice === 0n) {
                bondingPrice = DEFAULT_PRICE;
            }
            // Update price in perpetual contract
            const updateHash = await walletClient.writeContract({
                account: walletClient.account,
                chain: mantleTestnet,
                address: contracts.perpetualTrading,
                abi: perpetualTradingABI,
                functionName: 'updateMemeTokenPrice',
                args: [tokenAddress, bondingPrice],
            });
            await publicClient.waitForTransactionReceipt({ hash: updateHash, timeout: 60_000 });
        }
        // Estimate gas first
        try {
            await publicClient.estimateContractGas({
                address: contracts.perpetualTrading,
                abi: perpetualTradingABI,
                functionName: 'openPosition',
                args: [tokenAddress, isLong, marginWei, BigInt(leverage)],
                value: marginWei,
                account: walletClient.account,
            });
        }
        catch (gasError) {
            throw new Error(`Transaction would fail: ${parseBlockchainError(gasError)}`);
        }
        // Open position
        const hash = await walletClient.writeContract({
            account: walletClient.account,
            chain: mantleTestnet,
            address: contracts.perpetualTrading,
            abi: perpetualTradingABI,
            functionName: 'openPosition',
            args: [tokenAddress, isLong, marginWei, BigInt(leverage)],
            value: marginWei,
        });
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000,
        });
        if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted on-chain');
        }
        // Extract positionId from event
        let positionId = 0n;
        for (const log of receipt.logs) {
            try {
                if (log.address.toLowerCase() === contracts.perpetualTrading.toLowerCase()) {
                    const decoded = decodeEventLog({
                        abi: perpetualTradingABI,
                        data: log.data,
                        topics: log.topics,
                    });
                    if (decoded.eventName === 'PositionOpened') {
                        // positionId is indexed, so it's in topics[1]
                        positionId = BigInt(log.topics[1] || '0');
                        break;
                    }
                }
            }
            catch {
                // Not our event, continue
            }
        }
        return { hash, positionId };
    }
    catch (error) {
        throw new Error(parseBlockchainError(error));
    }
}
// Close perpetual position
export async function closePosition(positionId, password) {
    const walletClient = await getWalletClient(password);
    const publicClient = getPublicClient();
    const hash = await walletClient.writeContract({
        account: walletClient.account,
        chain: mantleTestnet,
        address: contracts.perpetualTrading,
        abi: perpetualTradingABI,
        functionName: 'closePosition',
        args: [positionId],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
// Get user's position IDs
export async function getUserPositionIds(address) {
    const client = getPublicClient();
    const ids = await client.readContract({
        address: contracts.perpetualTrading,
        abi: perpetualTradingABI,
        functionName: 'getUserPositions',
        args: [address],
    });
    return ids;
}
// Get position details
export async function getPosition(positionId) {
    const client = getPublicClient();
    try {
        const pos = await client.readContract({
            address: contracts.perpetualTrading,
            abi: perpetualTradingABI,
            functionName: 'getPosition',
            args: [positionId],
        });
        return {
            id: positionId.toString(),
            positionId,
            user: pos.user,
            token: pos.token,
            isLong: pos.isLong,
            size: formatEther(pos.size),
            margin: formatEther(pos.margin),
            leverage: Number(pos.leverage),
            entryPrice: formatEther(pos.entryPrice),
            entryTime: pos.entryTime,
            lastFundingTime: pos.lastFundingTime,
            isOpen: pos.isOpen,
        };
    }
    catch {
        return null;
    }
}
// Get position PnL
export async function getPositionPnL(positionId) {
    const client = getPublicClient();
    try {
        const [pnl, isProfit] = (await client.readContract({
            address: contracts.perpetualTrading,
            abi: perpetualTradingABI,
            functionName: 'getPositionPnL',
            args: [positionId],
        }));
        return { pnl, isProfit };
    }
    catch {
        return { pnl: 0n, isProfit: true };
    }
}
// Get liquidation price
export async function getLiquidationPrice(positionId) {
    const client = getPublicClient();
    try {
        const price = await client.readContract({
            address: contracts.perpetualTrading,
            abi: perpetualTradingABI,
            functionName: 'getLiquidationPrice',
            args: [positionId],
        });
        return price;
    }
    catch {
        return 0n;
    }
}
// Get all positions for user with details
export async function getAllUserPositions(address) {
    const positionIds = await getUserPositionIds(address);
    const positions = [];
    for (const id of positionIds) {
        const pos = await getPosition(id);
        if (pos && pos.isOpen) {
            // Get PnL
            const { pnl, isProfit } = await getPositionPnL(id);
            pos.pnl = formatEther(pnl);
            pos.pnlIsProfit = isProfit;
            positions.push(pos);
        }
    }
    return positions;
}
//# sourceMappingURL=contracts.js.map