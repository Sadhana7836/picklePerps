import type { Token, Position, Trade, Portfolio, Holding } from '../types.js';

// Goldsky Subgraph URL - V2.1.0 with copy trading support
const GOLDSKY_SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cmj709d6q6eqo01w6advl8q19/subgraphs/pickleperps/2.1.0/gn';
const DEFAULT_SUBGRAPH_URL = process.env.PICKLEPERPS_SUBGRAPH_URL || GOLDSKY_SUBGRAPH_URL;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Generic fetch function for subgraph queries
async function fetchSubgraph<T>(
  query: string,
  variables?: Record<string, unknown>,
  url?: string
): Promise<T | null> {
  const subgraphUrl = url || DEFAULT_SUBGRAPH_URL;

  if (!subgraphUrl) {
    return null;
  }

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const result = (await response.json()) as GraphQLResponse<T>;

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data || null;
  } catch (error) {
    throw new Error(`Subgraph query failed: ${(error as Error).message}`);
  }
}

// Subgraph types (matches V2.1.0 schema)
interface SubgraphToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  creator: string;
  totalSupply: string;
  imageHash: string;
  createdAt: string;
  isActive: boolean;
  currentPrice: string;
  totalVolume: string;
  totalTrades: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

interface SubgraphPosition {
  id: string;
  positionId: string;
  token: { id: string; name: string; symbol: string; currentPrice: string };
  user: string;
  isLong: boolean;
  size: string;
  margin: string;
  leverage: string;
  entryPrice: string;
  entryTime: string;
  isOpen: boolean;
  pnl?: string;
  isProfit?: boolean;
}

interface SubgraphTrade {
  id: string;
  token: { id: string; name: string; symbol: string };
  trader: string;
  type: 'BUY' | 'SELL';
  ethAmount: string;
  tokenAmount: string;
  price: string;
  timestamp: string;
  txHash: string;
}

interface SubgraphUser {
  id: string;
  totalTrades: string;
  totalVolume: string;
  totalPositions: string;
  openPositions: string;
  totalPnl: string;
  winCount: string;
  lossCount: string;
  holdings: Array<{
    token: SubgraphToken;
    balance: string;
    averageBuyPrice: string;
    realizedPnl: string;
  }>;
  positions: SubgraphPosition[];
  trades: SubgraphTrade[];
}

// ============ QUERY FUNCTIONS ============

// Fetch all tokens (V2.1.0 schema)
export async function fetchTokens(first = 100, skip = 0): Promise<Token[]> {
  const query = `
    query GetAllTokens {
      tokens(first: ${first}, skip: ${skip}, orderBy: createdAt, orderDirection: desc) {
        id
        address
        name
        symbol
        creator
        totalSupply
        imageHash
        createdAt
        isActive
        currentPrice
        totalVolume
        totalTrades
        website
        twitter
        telegram
      }
    }
  `;

  const data = await fetchSubgraph<{ tokens: SubgraphToken[] }>(query);

  if (!data?.tokens) {
    return [];
  }

  return data.tokens.map(t => ({
    id: t.id,
    address: t.address || t.id,
    name: t.name,
    symbol: t.symbol,
    creator: t.creator,
    totalSupply: t.totalSupply,
    imageHash: t.imageHash,
    creatorAllocationBps: 0,
    createdAt: parseInt(t.createdAt),
    curveSupply: '0',
    initialPrice: '0',
    currentPrice: t.currentPrice || '0',
    soldFromCurve: '0',
    reserveBalance: '0',
    isActive: t.isActive,
    totalVolume: t.totalVolume || '0',
    totalTrades: parseInt(t.totalTrades) || 0,
    totalBuys: 0,
    totalSells: 0,
    website: t.website,
    twitter: t.twitter,
    telegram: t.telegram,
  }));
}

// Fetch trending tokens (by volume)
export async function fetchTrendingTokens(limit = 10): Promise<Token[]> {
  const query = `
    query GetTrendingTokens {
      tokens(first: ${limit}, orderBy: totalVolume, orderDirection: desc) {
        id
        address
        name
        symbol
        creator
        totalSupply
        imageHash
        createdAt
        isActive
        currentPrice
        totalVolume
        totalTrades
      }
    }
  `;

  const data = await fetchSubgraph<{ tokens: SubgraphToken[] }>(query);

  if (!data?.tokens) {
    return [];
  }

  return data.tokens.map(t => ({
    id: t.id,
    address: t.address || t.id,
    name: t.name,
    symbol: t.symbol,
    creator: t.creator,
    totalSupply: t.totalSupply,
    imageHash: t.imageHash,
    creatorAllocationBps: 0,
    createdAt: parseInt(t.createdAt),
    curveSupply: '0',
    initialPrice: '0',
    currentPrice: t.currentPrice || '0',
    soldFromCurve: '0',
    reserveBalance: '0',
    isActive: t.isActive,
    totalVolume: t.totalVolume || '0',
    totalTrades: parseInt(t.totalTrades) || 0,
    totalBuys: 0,
    totalSells: 0,
  }));
}

// Search tokens by name or symbol
export async function searchTokens(searchQuery: string): Promise<Token[]> {
  const tokens = await fetchTokens(200);
  const lowerQuery = searchQuery.toLowerCase();

  return tokens.filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.symbol.toLowerCase().includes(lowerQuery)
  );
}

// Fetch single token info
export async function fetchTokenInfo(address: string): Promise<Token | null> {
  const query = `
    query GetToken {
      token(id: "${address.toLowerCase()}") {
        id
        address
        name
        symbol
        creator
        totalSupply
        imageHash
        createdAt
        isActive
        currentPrice
        totalVolume
        totalTrades
        website
        twitter
        telegram
      }
    }
  `;

  const data = await fetchSubgraph<{ token: SubgraphToken | null }>(query);

  if (!data?.token) {
    return null;
  }

  const t = data.token;
  return {
    id: t.id,
    address: t.address || t.id,
    name: t.name,
    symbol: t.symbol,
    creator: t.creator,
    totalSupply: t.totalSupply,
    imageHash: t.imageHash,
    creatorAllocationBps: 0,
    createdAt: parseInt(t.createdAt),
    curveSupply: '0',
    initialPrice: '0',
    currentPrice: t.currentPrice || '0',
    soldFromCurve: '0',
    reserveBalance: '0',
    isActive: t.isActive,
    totalVolume: t.totalVolume || '0',
    totalTrades: parseInt(t.totalTrades) || 0,
    totalBuys: 0,
    totalSells: 0,
    website: t.website,
    twitter: t.twitter,
    telegram: t.telegram,
  };
}

// Fetch user portfolio
export async function fetchPortfolio(address: string): Promise<Portfolio | null> {
  const query = `
    query GetUserPortfolio($userId: Bytes!) {
      user(id: $userId) {
        id
        totalTrades
        totalVolume
        totalPositions
        openPositions
        totalPnl
        winCount
        lossCount
        holdings {
          token {
            id
            name
            symbol
            currentPrice
            imageHash
          }
          balance
          averageBuyPrice
          realizedPnl
        }
        positions(where: { isOpen: true }) {
          id
          positionId
          token {
            id
            name
            symbol
            currentPrice
          }
          isLong
          size
          margin
          leverage
          entryPrice
          entryTime
        }
      }
    }
  `;

  const data = await fetchSubgraph<{ user: SubgraphUser | null }>(query, {
    userId: address.toLowerCase(),
  });

  if (!data?.user) {
    return null;
  }

  const user = data.user;

  const holdings: Holding[] = (user.holdings || []).map(h => ({
    token: h.token.id,
    tokenSymbol: h.token.symbol,
    tokenName: h.token.name,
    balance: h.balance,
    averageBuyPrice: h.averageBuyPrice,
    currentPrice: h.token.currentPrice,
    value: '0', // Calculate client-side
    pnl: h.realizedPnl,
    pnlPercent: '0',
  }));

  const positions: Position[] = (user.positions || []).map(p => ({
    id: p.id,
    positionId: BigInt(p.positionId),
    user: user.id,
    token: p.token.id,
    tokenSymbol: p.token.symbol,
    isLong: p.isLong,
    size: p.size,
    margin: p.margin,
    leverage: parseInt(p.leverage),
    entryPrice: p.entryPrice,
    entryTime: BigInt(p.entryTime),
    lastFundingTime: BigInt(0),
    isOpen: true,
  }));

  return {
    address: user.id,
    holdings,
    positions,
    totalHoldingsValue: '0',
    totalPositionsValue: '0',
    totalPnl: user.totalPnl,
  };
}

// Fetch user positions
export async function fetchPositions(address: string, tokenAddress?: string): Promise<Position[]> {
  const query = tokenAddress
    ? `
      query GetUserPositionsForToken($userId: Bytes!, $tokenId: Bytes!) {
        positions(
          where: { user: $userId, token: $tokenId, isOpen: true }
          orderBy: entryTime
          orderDirection: desc
        ) {
          id
          positionId
          token { id name symbol currentPrice }
          isLong
          size
          margin
          leverage
          entryPrice
          entryTime
        }
      }
    `
    : `
      query GetUserPositions($userId: Bytes!) {
        positions(
          where: { user: $userId, isOpen: true }
          orderBy: entryTime
          orderDirection: desc
        ) {
          id
          positionId
          token { id name symbol currentPrice }
          isLong
          size
          margin
          leverage
          entryPrice
          entryTime
        }
      }
    `;

  const variables: Record<string, string> = { userId: address.toLowerCase() };
  if (tokenAddress) {
    variables.tokenId = tokenAddress.toLowerCase();
  }

  const data = await fetchSubgraph<{ positions: SubgraphPosition[] }>(query, variables);

  if (!data?.positions) {
    return [];
  }

  return data.positions.map(p => ({
    id: p.id,
    positionId: BigInt(p.positionId),
    user: address,
    token: p.token.id,
    tokenSymbol: p.token.symbol,
    isLong: p.isLong,
    size: p.size,
    margin: p.margin,
    leverage: parseInt(p.leverage),
    entryPrice: p.entryPrice,
    entryTime: BigInt(p.entryTime),
    lastFundingTime: BigInt(0),
    isOpen: true,
  }));
}

// Fetch recent trades
export async function fetchTrades(tokenAddress?: string, limit = 50): Promise<Trade[]> {
  const query = tokenAddress
    ? `
      query GetTokenTrades($tokenId: Bytes!, $first: Int!) {
        trades(
          where: { token: $tokenId }
          first: $first
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          token { id name symbol }
          trader
          type
          ethAmount
          tokenAmount
          price
          timestamp
          txHash
        }
      }
    `
    : `
      query GetRecentTrades($first: Int!) {
        trades(first: $first, orderBy: timestamp, orderDirection: desc) {
          id
          token { id name symbol }
          trader
          type
          ethAmount
          tokenAmount
          price
          timestamp
          txHash
        }
      }
    `;

  const variables: Record<string, unknown> = { first: limit };
  if (tokenAddress) {
    variables.tokenId = tokenAddress.toLowerCase();
  }

  const data = await fetchSubgraph<{ trades: SubgraphTrade[] }>(query, variables);

  if (!data?.trades) {
    return [];
  }

  return data.trades.map(t => ({
    id: t.id,
    token: t.token.id,
    tokenSymbol: t.token.symbol,
    trader: t.trader,
    isBuy: t.type === 'BUY',
    ethAmount: t.ethAmount,
    tokenAmount: t.tokenAmount,
    price: t.price,
    fee: '0',
    timestamp: parseInt(t.timestamp),
    txHash: t.txHash,
  }));
}

// Fetch leaderboard
export async function fetchLeaderboard(
  period = 'all-time',
  limit = 20
): Promise<
  Array<{
    user: string;
    pnl: string;
    volume: string;
    trades: string;
    winRate: string;
  }>
> {
  const query = `
    query GetLeaderboard($period: String!, $first: Int!) {
      traderLeaderboards(
        where: { period: $period }
        orderBy: pnl
        orderDirection: desc
        first: $first
      ) {
        user
        pnl
        volume
        trades
        winRate
      }
    }
  `;

  const data = await fetchSubgraph<{
    traderLeaderboards: Array<{
      user: string;
      pnl: string;
      volume: string;
      trades: string;
      winRate: string;
    }>;
  }>(query, { period, first: limit });

  return data?.traderLeaderboards || [];
}
