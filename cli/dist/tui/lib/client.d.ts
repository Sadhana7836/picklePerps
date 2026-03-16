import { formatEther as viemFormatEther, type PublicClient, type WalletClient, type Chain } from 'viem';
export declare const mantleTestnet: Chain;
export declare const contracts: {
    memeTokenFactory: `0x${string}`;
    bondingCurveMarket: `0x${string}`;
    perpetualTrading: `0x${string}`;
    copyTrading: `0x${string}`;
    rwaPerpetualTrading: `0x${string}`;
};
export declare function getPublicClient(): PublicClient;
export declare function getWalletClient(password: string): Promise<WalletClient>;
export declare function getNativeBalance(address: string): Promise<bigint>;
export declare function getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
}>;
export declare function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<bigint>;
export declare const formatEther: typeof viemFormatEther;
//# sourceMappingURL=client.d.ts.map