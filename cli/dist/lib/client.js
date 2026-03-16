import { createPublicClient, createWalletClient, http, formatEther, parseEther, } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { loadPrivateKey, getWalletAddress } from './wallet.js';
// Mantle Sepolia Testnet configuration
export const mantleTestnet = {
    id: 5003,
    name: 'Mantle Sepolia Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Mantle',
        symbol: 'MNT',
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
    memeTokenFactory: '0x083c920Eb055997a4becf51d9854dCd441a40b3E',
    bondingCurveMarket: '0x93b268325A9862645c82b32229f3B52264750Ca2',
    perpetualTrading: '0x8081b646f349c049f2d5e8a400057d411dd657bd',
    copyTrading: '0x03f0b1dd70d5ad5c46fa8084965ccb5f89d9242c',
};
// Explorer URL helpers
export function getExplorerUrl(type, hash) {
    const base = mantleTestnet.blockExplorers?.default.url || 'https://explorer.sepolia.mantle.xyz';
    return `${base}/${type}/${hash}`;
}
// Create a fresh public client each time to avoid caching issues
export function getPublicClient() {
    return createPublicClient({
        chain: mantleTestnet,
        transport: http(),
    });
}
// Create wallet client (requires password)
export async function getWalletClient(password) {
    const privateKey = loadPrivateKey(password);
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: mantleTestnet,
        transport: http(),
    });
    return client;
}
// Get pending nonce from network
export async function getPendingNonce(address) {
    const client = getPublicClient();
    return client.getTransactionCount({
        address: address,
        blockTag: 'pending',
    });
}
// Get native balance (MNT)
export async function getNativeBalance(address) {
    const client = getPublicClient();
    const targetAddress = address || getWalletAddress();
    if (!targetAddress) {
        throw new Error('No wallet configured');
    }
    return client.getBalance({ address: targetAddress });
}
// Get token balance (ERC20)
export async function getTokenBalance(tokenAddress, walletAddress) {
    const client = getPublicClient();
    const address = walletAddress || getWalletAddress();
    if (!address) {
        throw new Error('No wallet configured');
    }
    const balance = await client.readContract({
        address: tokenAddress,
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
        args: [address],
    });
    return balance;
}
// Get token info
export async function getTokenInfo(tokenAddress) {
    const client = getPublicClient();
    const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({
            address: tokenAddress,
            abi: [{ type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
            functionName: 'name',
        }),
        client.readContract({
            address: tokenAddress,
            abi: [{ type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' }],
            functionName: 'symbol',
        }),
        client.readContract({
            address: tokenAddress,
            abi: [{ type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }],
            functionName: 'decimals',
        }),
        client.readContract({
            address: tokenAddress,
            abi: [{ type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
            functionName: 'totalSupply',
        }),
    ]);
    return { name, symbol, decimals, totalSupply };
}
// Wait for transaction receipt
export async function waitForTransaction(hash) {
    const client = getPublicClient();
    const receipt = await client.waitForTransactionReceipt({ hash });
    return {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
    };
}
// Get current nonce for wallet
export async function getCurrentNonce(address) {
    const client = getPublicClient();
    return client.getTransactionCount({
        address: address,
        blockTag: 'pending',
    });
}
// Export viem helpers
export { formatEther, parseEther };
//# sourceMappingURL=client.js.map