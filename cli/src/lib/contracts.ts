import { parseEther, formatEther, decodeEventLog } from 'viem';
import { getPublicClient, getWalletClient, contracts, mantleTestnet } from './client.js';
import type { BuyQuote, SellQuote, Position } from '../types.js';

// Get the next nonce for transactions (handles pending txs)
async function getNextNonce(address: `0x${string}`): Promise<number> {
  const client = getPublicClient();
  const pendingNonce = await client.getTransactionCount({
    address,
    blockTag: 'pending',
  });
  return pendingNonce;
}

// Import full ABIs from JSON files (same as main repo)
import bondingCurveMarketABI from './bondingCurveMarketABI.json' with { type: 'json' };
import perpetualTradingABI from './perpetualTradingABI.json' with { type: 'json' };

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
] as const;

// ============ BONDING CURVE FUNCTIONS ============

// Get buy quote
export async function getBuyQuote(tokenAddress: string, ethAmount: string): Promise<BuyQuote> {
  const client = getPublicClient();
  const amountWei = parseEther(ethAmount);

  const [tokensOut, avgPrice, fee] = (await client.readContract({
    address: contracts.bondingCurveMarket,
    abi: bondingCurveMarketABI,
    functionName: 'getBuyQuote',
    args: [tokenAddress as `0x${string}`, amountWei],
  })) as [bigint, bigint, bigint];

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
export async function getSellQuote(tokenAddress: string, tokenAmount: string): Promise<SellQuote> {
  const client = getPublicClient();
  const amountWei = parseEther(tokenAmount);

  const [ethOut, avgPrice, fee] = (await client.readContract({
    address: contracts.bondingCurveMarket,
    abi: bondingCurveMarketABI,
    functionName: 'getSellQuote',
    args: [tokenAddress as `0x${string}`, amountWei],
  })) as [bigint, bigint, bigint];

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
export async function getCurrentPrice(tokenAddress: string): Promise<bigint> {
  const client = getPublicClient();

  try {
    const price = await client.readContract({
      address: contracts.bondingCurveMarket,
      abi: bondingCurveMarketABI,
      functionName: 'getCurrentPrice',
      args: [tokenAddress as `0x${string}`],
    });
    return price as bigint;
  } catch {
    return 0n;
  }
}

// Check if token is listed on bonding curve
export async function isTokenListed(tokenAddress: string): Promise<boolean> {
  const client = getPublicClient();

  try {
    const listed = await client.readContract({
      address: contracts.bondingCurveMarket,
      abi: bondingCurveMarketABI,
      functionName: 'isListed',
      args: [tokenAddress as `0x${string}`],
    });
    return listed as boolean;
  } catch {
    return false;
  }
}

// Get curve progress (0-10000 basis points)
export async function getCurveProgress(tokenAddress: string): Promise<number> {
  const client = getPublicClient();

  try {
    const progress = await client.readContract({
      address: contracts.bondingCurveMarket,
      abi: bondingCurveMarketABI,
      functionName: 'getCurveProgress',
      args: [tokenAddress as `0x${string}`],
    });
    return Number(progress as bigint) / 100; // Convert to percentage
  } catch {
    return 0;
  }
}

// Buy tokens on bonding curve (matching main repo implementation)
export async function buyTokens(
  tokenAddress: string,
  ethAmount: string,
  minTokensOut: bigint,
  password: string
): Promise<{ hash: string; tokensReceived: bigint }> {
  const walletClient = await getWalletClient(password);
  const publicClient = getPublicClient();
  const amountWei = parseEther(ethAmount);

  // Get fresh nonce to avoid conflicts with pending transactions
  const nonce = await getNextNonce(walletClient.account.address);

  // Execute buy with explicit nonce
  const hash = await walletClient.writeContract({
    chain: mantleTestnet,
    address: contracts.bondingCurveMarket,
    abi: bondingCurveMarketABI,
    functionName: 'buy',
    args: [tokenAddress as `0x${string}`, minTokensOut],
    value: amountWei,
    nonce,
  });

  // Wait for confirmation and extract tokensOut from event
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  let tokensReceived = 0n;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: bondingCurveMarketABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'TokenBought') {
        tokensReceived = (decoded.args as unknown as { tokensOut: bigint }).tokensOut;
        break;
      }
    } catch {
      // Not our event, continue
    }
  }

  return { hash, tokensReceived };
}

// Sell tokens on bonding curve (matching main repo implementation)
export async function sellTokens(
  tokenAddress: string,
  tokenAmount: string,
  minEthOut: bigint,
  password: string
): Promise<{ hash: string; ethReceived: bigint }> {
  const walletClient = await getWalletClient(password);
  const publicClient = getPublicClient();
  const amountWei = parseEther(tokenAmount);

  // Check allowance and approve if needed
  const allowance = await publicClient.readContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [walletClient.account!.address, contracts.bondingCurveMarket],
  });

  if ((allowance as bigint) < amountWei) {
    const approveHash = await walletClient.writeContract({
      chain: mantleTestnet,
      address: tokenAddress as `0x${string}`,
      abi: erc20ABI,
      functionName: 'approve',
      args: [contracts.bondingCurveMarket, amountWei],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  // Execute sell
  const hash = await walletClient.writeContract({
    chain: mantleTestnet,
    address: contracts.bondingCurveMarket,
    abi: bondingCurveMarketABI,
    functionName: 'sell',
    args: [tokenAddress as `0x${string}`, amountWei, minEthOut],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  let ethReceived = 0n;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: bondingCurveMarketABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'TokenSold') {
        ethReceived = (decoded.args as unknown as { ethOut: bigint }).ethOut;
        break;
      }
    } catch {
      // Not our event, continue
    }
  }

  return { hash, ethReceived };
}

// ============ PERPETUAL TRADING FUNCTIONS ============

// Default price for meme tokens (same as main repo)
const DEFAULT_PRICE = BigInt(10000000); // $0.0001 * 1e8

// Get token price from perpetual contract
export async function getPerpetualPrice(tokenAddress: string): Promise<{ price: bigint; isValid: boolean }> {
  const client = getPublicClient();

  try {
    const [price, isValid] = (await client.readContract({
      address: contracts.perpetualTrading,
      abi: perpetualTradingABI,
      functionName: 'getCurrentPrice',
      args: [tokenAddress as `0x${string}`],
    })) as [bigint, boolean];

    return { price, isValid };
  } catch {
    return { price: 0n, isValid: false };
  }
}

// Open perpetual position (matching main repo implementation)
export async function openPosition(
  tokenAddress: string,
  isLong: boolean,
  marginAmount: string,
  leverage: number,
  password: string
): Promise<{ hash: string; positionId: bigint }> {
  const walletClient = await getWalletClient(password);
  const publicClient = getPublicClient();
  const marginWei = parseEther(marginAmount);

  // Check if price is available, if not update it first (same as main repo)
  const { isValid } = await getPerpetualPrice(tokenAddress);
  if (!isValid) {
    // Get price from bonding curve
    let bondingPrice = await getCurrentPrice(tokenAddress);

    // If no bonding curve price, use default price (same as main repo)
    if (bondingPrice === 0n) {
      bondingPrice = DEFAULT_PRICE;
    }

    // Update price in perpetual contract
    const updateHash = await walletClient.writeContract({
      chain: mantleTestnet,
      address: contracts.perpetualTrading,
      abi: perpetualTradingABI,
      functionName: 'updateMemeTokenPrice',
      args: [tokenAddress as `0x${string}`, bondingPrice],
    });
    await publicClient.waitForTransactionReceipt({ hash: updateHash });
  }

  // Open position
  const hash = await walletClient.writeContract({
    chain: mantleTestnet,
    address: contracts.perpetualTrading,
    abi: perpetualTradingABI,
    functionName: 'openPosition',
    args: [tokenAddress as `0x${string}`, isLong, marginWei, BigInt(leverage)],
    value: marginWei,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Extract positionId from event (same as main repo)
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
    } catch {
      // Not our event, continue
    }
  }

  return { hash, positionId };
}

// Close perpetual position
export async function closePosition(positionId: bigint, password: string): Promise<string> {
  const walletClient = await getWalletClient(password);
  const publicClient = getPublicClient();

  const hash = await walletClient.writeContract({
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
export async function getUserPositionIds(address: string): Promise<bigint[]> {
  const client = getPublicClient();

  const ids = await client.readContract({
    address: contracts.perpetualTrading,
    abi: perpetualTradingABI,
    functionName: 'getUserPositions',
    args: [address as `0x${string}`],
  });

  return ids as bigint[];
}

// Get position details
export async function getPosition(positionId: bigint): Promise<Position | null> {
  const client = getPublicClient();

  try {
    const pos = await client.readContract({
      address: contracts.perpetualTrading,
      abi: perpetualTradingABI,
      functionName: 'getPosition',
      args: [positionId],
    }) as {
      user: string;
      token: string;
      isLong: boolean;
      size: bigint;
      margin: bigint;
      leverage: bigint;
      entryPrice: bigint;
      entryTime: bigint;
      lastFundingTime: bigint;
      isOpen: boolean;
    };

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
  } catch {
    return null;
  }
}

// Get position PnL
export async function getPositionPnL(positionId: bigint): Promise<{ pnl: bigint; isProfit: boolean }> {
  const client = getPublicClient();

  try {
    const [pnl, isProfit] = (await client.readContract({
      address: contracts.perpetualTrading,
      abi: perpetualTradingABI,
      functionName: 'getPositionPnL',
      args: [positionId],
    })) as [bigint, boolean];

    return { pnl, isProfit };
  } catch {
    return { pnl: 0n, isProfit: true };
  }
}

// Get liquidation price
export async function getLiquidationPrice(positionId: bigint): Promise<bigint> {
  const client = getPublicClient();

  try {
    const price = await client.readContract({
      address: contracts.perpetualTrading,
      abi: perpetualTradingABI,
      functionName: 'getLiquidationPrice',
      args: [positionId],
    });
    return price as bigint;
  } catch {
    return 0n;
  }
}

// Get all positions for user with details
export async function getAllUserPositions(address: string): Promise<Position[]> {
  const positionIds = await getUserPositionIds(address);
  const positions: Position[] = [];

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
