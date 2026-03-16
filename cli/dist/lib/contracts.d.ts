import type { BuyQuote, SellQuote, Position } from '../types.js';
export declare function getBuyQuote(tokenAddress: string, ethAmount: string): Promise<BuyQuote>;
export declare function getSellQuote(tokenAddress: string, tokenAmount: string): Promise<SellQuote>;
export declare function getCurrentPrice(tokenAddress: string): Promise<bigint>;
export declare function isTokenListed(tokenAddress: string): Promise<boolean>;
export declare function getCurveProgress(tokenAddress: string): Promise<number>;
export declare function buyTokens(tokenAddress: string, ethAmount: string, minTokensOut: bigint, password: string): Promise<{
    hash: string;
    tokensReceived: bigint;
}>;
export declare function sellTokens(tokenAddress: string, tokenAmount: string, minEthOut: bigint, password: string): Promise<{
    hash: string;
    ethReceived: bigint;
}>;
export declare function getPerpetualPrice(tokenAddress: string): Promise<{
    price: bigint;
    isValid: boolean;
}>;
export declare function openPosition(tokenAddress: string, isLong: boolean, marginAmount: string, leverage: number, password: string): Promise<{
    hash: string;
    positionId: bigint;
}>;
export declare function closePosition(positionId: bigint, password: string): Promise<string>;
export declare function getUserPositionIds(address: string): Promise<bigint[]>;
export declare function getPosition(positionId: bigint): Promise<Position | null>;
export declare function getPositionPnL(positionId: bigint): Promise<{
    pnl: bigint;
    isProfit: boolean;
}>;
export declare function getLiquidationPrice(positionId: bigint): Promise<bigint>;
export declare function getAllUserPositions(address: string): Promise<Position[]>;
//# sourceMappingURL=contracts.d.ts.map