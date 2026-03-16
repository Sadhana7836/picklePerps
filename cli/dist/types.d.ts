export interface Token {
    id: string;
    address: string;
    name: string;
    symbol: string;
    creator: string;
    totalSupply: string;
    imageHash: string;
    creatorAllocationBps: number;
    createdAt: number;
    curveSupply: string;
    initialPrice: string;
    currentPrice: string;
    soldFromCurve: string;
    reserveBalance: string;
    isActive: boolean;
    totalVolume: string;
    totalTrades: number;
    totalBuys: number;
    totalSells: number;
    website?: string;
    twitter?: string;
    telegram?: string;
}
export interface Position {
    id: string;
    positionId: bigint;
    user: string;
    token: string;
    tokenSymbol?: string;
    isLong: boolean;
    size: string;
    margin: string;
    leverage: number;
    entryPrice: string;
    entryTime: bigint;
    lastFundingTime: bigint;
    isOpen: boolean;
    pnl?: string;
    pnlIsProfit?: boolean;
}
export interface Trade {
    id: string;
    token: string;
    tokenSymbol?: string;
    trader: string;
    isBuy: boolean;
    ethAmount: string;
    tokenAmount: string;
    price: string;
    fee: string;
    timestamp: number;
    txHash: string;
}
export interface Holding {
    token: string;
    tokenSymbol: string;
    tokenName: string;
    balance: string;
    averageBuyPrice: string;
    currentPrice: string;
    value: string;
    pnl: string;
    pnlPercent: string;
}
export interface Portfolio {
    address: string;
    holdings: Holding[];
    positions: Position[];
    totalHoldingsValue: string;
    totalPositionsValue: string;
    totalPnl: string;
}
export interface BuyQuote {
    tokensOut: bigint;
    avgPrice: bigint;
    fee: bigint;
    priceImpact: number;
}
export interface SellQuote {
    ethOut: bigint;
    avgPrice: bigint;
    fee: bigint;
    priceImpact: number;
}
export interface Keystore {
    version: number;
    address: string;
    cipher: string;
    ciphertext: string;
    salt: string;
    iv: string;
    authTag: string;
}
export interface Config {
    network: 'testnet' | 'mainnet';
    rpcUrl?: string;
    defaultSlippage: number;
    subgraphUrl?: string;
}
export interface CLIContext {
    network: 'testnet' | 'mainnet';
    json: boolean;
    quiet: boolean;
}
//# sourceMappingURL=types.d.ts.map