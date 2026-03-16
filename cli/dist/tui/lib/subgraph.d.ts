import type { Token, Position, Trade, Portfolio } from '../types.js';
export declare function fetchTokens(first?: number, skip?: number): Promise<Token[]>;
export declare function fetchTrendingTokens(limit?: number): Promise<Token[]>;
export declare function searchTokens(searchQuery: string): Promise<Token[]>;
export declare function fetchTokenInfo(address: string): Promise<Token | null>;
export declare function fetchPortfolio(address: string): Promise<Portfolio | null>;
export declare function fetchPositions(address: string, tokenAddress?: string): Promise<Position[]>;
export declare function fetchTrades(tokenAddress?: string, limit?: number): Promise<Trade[]>;
export declare function fetchLeaderboard(period?: string, limit?: number): Promise<Array<{
    user: string;
    pnl: string;
    volume: string;
    trades: string;
    winRate: string;
}>>;
//# sourceMappingURL=subgraph.d.ts.map