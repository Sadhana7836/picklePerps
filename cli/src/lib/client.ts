import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  formatEther,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { loadPrivateKey, getWalletAddress } from './wallet.js';

// Stellar Testnet Testnet configuration
export const mantleTestnet: Chain = {
  id: 5003,
  name: 'Stellar Testnet Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Stellar',
    symbol: 'XLM',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
};

// Contract addresses
export const contracts = {
  memeTokenFactory: '0x083c920Eb055997a4becf51d9854dCd441a40b3E' as `0x${string}`,
  bondingCurveMarket: '0x93b268325A9862645c82b32229f3B52264750Ca2' as `0x${string}`,
  perpetualTrading: '0x8081b646f349c049f2d5e8a400057d411dd657bd' as `0x${string}`,
  copyTrading: '0x03f0b1dd70d5ad5c46fa8084965ccb5f89d9242c' as `0x${string}`,
};

// Explorer URL helpers
export function getExplorerUrl(type: 'tx' | 'address' | 'token', hash: string): string {
  const base = mantleTestnet.blockExplorers?.default.url || 'https://explorer.sepolia.mantle.xyz';
  return `${base}/${type}/${hash}`;
}

// Create a fresh public client each time to avoid caching issues
export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: mantleTestnet,
    transport: http(),
  });
}

// Create wallet client (requires password)
export async function getWalletClient(password: string) {
  const privateKey = loadPrivateKey(password);
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const client = createWalletClient({
    account,
    chain: mantleTestnet,
    transport: http(),
  });

  return client;
}

// Get pending nonce from network
export async function getPendingNonce(address: string): Promise<number> {
  const client = getPublicClient();
  return client.getTransactionCount({
    address: address as `0x${string}`,
    blockTag: 'pending',
  });
}

// Get native balance (XLM)
export async function getNativeBalance(address?: string): Promise<bigint> {
  const client = getPublicClient();
  const targetAddress = address || getWalletAddress();

  if (!targetAddress) {
    throw new Error('No wallet configured');
  }

  return client.getBalance({ address: targetAddress as `0x${string}` });
}

// Get token balance (ERC20)
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress?: string
): Promise<bigint> {
  const client = getPublicClient();
  const address = walletAddress || getWalletAddress();

  if (!address) {
    throw new Error('No wallet configured');
  }

  const balance = await client.readContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  return balance as bigint;
}

// Get token info
export async function getTokenInfo(tokenAddress: string): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}> {
  const client = getPublicClient();

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [{ type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
      functionName: 'name',
    }) as Promise<string>,
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [{ type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
      functionName: 'symbol',
    }) as Promise<string>,
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [{ type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }],
      functionName: 'decimals',
    }) as Promise<number>,
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [{ type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
      functionName: 'totalSupply',
    }) as Promise<bigint>,
  ]);

  return { name, symbol, decimals, totalSupply };
}

// Wait for transaction receipt
export async function waitForTransaction(hash: `0x${string}`): Promise<{
  status: 'success' | 'reverted';
  blockNumber: bigint;
  gasUsed: bigint;
}> {
  const client = getPublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });

  return {
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
  };
}

// Get current nonce for wallet
export async function getCurrentNonce(address: string): Promise<number> {
  const client = getPublicClient();
  return client.getTransactionCount({
    address: address as `0x${string}`,
    blockTag: 'pending',
  });
}

// Export viem helpers
export { formatEther, parseEther };
