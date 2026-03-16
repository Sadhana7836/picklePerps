/**
 * Real-Time Trade Event Service
 * Uses Stellar/Soroban event polling for trade updates
 */

import { server } from './stellar';
import { CONTRACT_IDS } from './stellar';
import { formatAmount } from './soroban';

export interface TradeEvent {
  type: "BUY" | "SELL";
  token: string;
  trader: string;
  ethAmount: string;
  tokenAmount: string;
  newPrice: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export interface PriceUpdate {
  token: string;
  price: string;
  timestamp: number;
}

type TradeCallback = (trade: TradeEvent) => void;
type PriceCallback = (update: PriceUpdate) => void;

class TradeEventService {
  private tradeSubscribers: Map<string, Set<TradeCallback>> = new Map();
  private globalTradeSubscribers: Set<TradeCallback> = new Set();
  private priceSubscribers: Map<string, Set<PriceCallback>> = new Map();
  private isListening = false;
  private recentTrades: TradeEvent[] = [];
  private latestPrices: Map<string, PriceUpdate> = new Map();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastLedger: number = 0;

  initialize(_client?: unknown) {
    if (this.isListening) return;
    this.startListening();
  }

  private startListening() {
    if (this.isListening) return;

    this.isListening = true;
    console.log("[TradeEvents] Starting Soroban event polling...");

    const contractId = CONTRACT_IDS.bondingCurve;
    if (!contractId) {
      console.warn("[TradeEvents] Bonding curve contract ID not set");
      return;
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const events = await server.getEvents({
          startLedger: this.lastLedger || undefined,
          filters: [
            {
              type: 'contract',
              contractIds: [contractId],
            },
          ],
          limit: 50,
        });

        if (events.events && events.events.length > 0) {
          for (const event of events.events) {
            const trade = this.parseTradeEvent(event);
            if (trade) this.handleTrade(trade);
          }

          const lastEvent = events.events[events.events.length - 1];
          if (lastEvent && lastEvent.ledger) {
            this.lastLedger = lastEvent.ledger;
          }
        }
      } catch {
        // Polling error, will retry
      }
    }, 3000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseTradeEvent(event: any): TradeEvent | null {
    try {
      const args = event.value;
      if (!args) return null;

      const type = args.type === "sell" ? "SELL" : "BUY";

      return {
        type,
        token: args.token || '',
        trader: args.trader || args.buyer || args.seller || '',
        ethAmount: args.xlmAmount ? formatAmount(BigInt(args.xlmAmount)) : "0",
        tokenAmount: args.tokenAmount ? formatAmount(BigInt(args.tokenAmount)) : "0",
        newPrice: args.newPrice ? formatAmount(BigInt(args.newPrice)) : "0",
        timestamp: Date.now(),
        txHash: event.txHash || '',
        blockNumber: BigInt(event.ledger || 0),
      };
    } catch (error) {
      console.error("[TradeEvents] Failed to parse event:", error);
      return null;
    }
  }

  private handleTrade(trade: TradeEvent) {
    console.log(`[TradeEvents] ${trade.type} - ${trade.token.slice(0, 10)}... - ${trade.ethAmount} XLM`);

    this.recentTrades.unshift(trade);
    if (this.recentTrades.length > 100) {
      this.recentTrades.pop();
    }

    const priceUpdate: PriceUpdate = {
      token: trade.token,
      price: trade.newPrice,
      timestamp: trade.timestamp,
    };
    this.latestPrices.set(trade.token.toLowerCase(), priceUpdate);

    this.globalTradeSubscribers.forEach((cb) => {
      try { cb(trade); } catch (e) { console.error("[TradeEvents] Callback error:", e); }
    });

    const tokenKey = trade.token.toLowerCase();
    const tokenCallbacks = this.tradeSubscribers.get(tokenKey);
    if (tokenCallbacks) {
      tokenCallbacks.forEach((cb) => {
        try { cb(trade); } catch (e) { console.error("[TradeEvents] Callback error:", e); }
      });
    }

    const priceCallbacks = this.priceSubscribers.get(tokenKey);
    if (priceCallbacks) {
      priceCallbacks.forEach((cb) => {
        try { cb(priceUpdate); } catch (e) { console.error("[TradeEvents] Price callback error:", e); }
      });
    }
  }

  subscribeToToken(token: string, callback: TradeCallback): () => void {
    const tokenKey = token.toLowerCase();

    if (!this.tradeSubscribers.has(tokenKey)) {
      this.tradeSubscribers.set(tokenKey, new Set());
    }

    this.tradeSubscribers.get(tokenKey)!.add(callback);

    return () => {
      const callbacks = this.tradeSubscribers.get(tokenKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.tradeSubscribers.delete(tokenKey);
        }
      }
    };
  }

  subscribeToAllTrades(callback: TradeCallback): () => void {
    this.globalTradeSubscribers.add(callback);

    return () => {
      this.globalTradeSubscribers.delete(callback);
    };
  }

  subscribeToPriceUpdates(token: string, callback: PriceCallback): () => void {
    const tokenKey = token.toLowerCase();

    if (!this.priceSubscribers.has(tokenKey)) {
      this.priceSubscribers.set(tokenKey, new Set());
    }

    this.priceSubscribers.get(tokenKey)!.add(callback);

    const currentPrice = this.latestPrices.get(tokenKey);
    if (currentPrice) {
      setTimeout(() => callback(currentPrice), 0);
    }

    return () => {
      const callbacks = this.priceSubscribers.get(tokenKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.priceSubscribers.delete(tokenKey);
        }
      }
    };
  }

  getRecentTrades(token?: string, limit = 50): TradeEvent[] {
    if (token) {
      return this.recentTrades
        .filter((t) => t.token.toLowerCase() === token.toLowerCase())
        .slice(0, limit);
    }
    return this.recentTrades.slice(0, limit);
  }

  getLatestPrice(token: string): PriceUpdate | undefined {
    return this.latestPrices.get(token.toLowerCase());
  }

  async fetchRecentTradesFromChain(
    token: string,
    fromLedger: bigint | number,
    _toLedger: bigint | number | "latest" = "latest"
  ): Promise<TradeEvent[]> {
    const contractId = CONTRACT_IDS.bondingCurve;
    if (!contractId) return [];

    try {
      const events = await server.getEvents({
        startLedger: typeof fromLedger === 'bigint' ? Number(fromLedger) : fromLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [contractId],
          },
        ],
        limit: 100,
      });

      const trades: TradeEvent[] = [];

      if (events.events) {
        for (const event of events.events) {
          const trade = this.parseTradeEvent(event);
          if (trade && trade.token.toLowerCase() === token.toLowerCase()) {
            trades.push(trade);
          }
        }
      }

      trades.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      return trades;
    } catch (error) {
      console.error("[TradeEvents] Failed to fetch historical trades:", error);
      return [];
    }
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isListening = false;
    this.tradeSubscribers.clear();
    this.globalTradeSubscribers.clear();
    this.priceSubscribers.clear();
  }
}

// Singleton instance
export const tradeEventService = new TradeEventService();
