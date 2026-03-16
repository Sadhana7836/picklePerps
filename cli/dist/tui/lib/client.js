import { createPublicClient, createWalletClient, http, formatEther as viemFormatEther, } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { loadPrivateKey, getConfig } from './wallet.js';
// Mantle Testnet chain definition
export const mantleTestnet = {
    id: 5003,
    name: 'Mantle Sepolia Testnet',
    nativeCurrency: {
        name: 'Mantle',
        symbol: 'MNT',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.sepolia.mantle.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Mantle Sepolia Explorer',
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
    rwaPerpetualTrading: '0xf7ee5d6fdebdc25e08ebffc8f77ec3a59a1403da',
};
// Singleton public client
let publicClient = null;
export function getPublicClient() {
    if (!publicClient) {
        const config = getConfig();
        const rpcUrl = config.rpcUrl || mantleTestnet.rpcUrls.default.http[0];
        publicClient = createPublicClient({
            chain: mantleTestnet,
            transport: http(rpcUrl),
        });
    }
    return publicClient;
}
// Create wallet client with password
export async function getWalletClient(password) {
    const privateKey = loadPrivateKey(password);
    const account = privateKeyToAccount(privateKey);
    const config = getConfig();
    const rpcUrl = config.rpcUrl || mantleTestnet.rpcUrls.default.http[0];
    return createWalletClient({
        account,
        chain: mantleTestnet,
        transport: http(rpcUrl),
    });
}
// Get native balance
export async function getNativeBalance(address) {
    const client = getPublicClient();
    return client.getBalance({ address: address });
}
// ERC20 ABI for basic token operations
const erc20ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
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
// Get token info
export async function getTokenInfo(tokenAddress) {
    const client = getPublicClient();
    const address = tokenAddress;
    const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({ address, abi: erc20ABI, functionName: 'name' }),
        client.readContract({ address, abi: erc20ABI, functionName: 'symbol' }),
        client.readContract({ address, abi: erc20ABI, functionName: 'decimals' }),
        client.readContract({ address, abi: erc20ABI, functionName: 'totalSupply' }),
    ]);
    return {
        name: name,
        symbol: symbol,
        decimals: decimals,
        totalSupply: totalSupply,
    };
}
// Get token balance
export async function getTokenBalance(tokenAddress, walletAddress) {
    const client = getPublicClient();
    const balance = await client.readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
    });
    return balance;
}
// Re-export formatEther
export const formatEther = viemFormatEther;
//# sourceMappingURL=client.js.map