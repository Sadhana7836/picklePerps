"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { callContract, toScVal, formatAmount } from "@/lib/soroban"
import { CONTRACT_IDS } from "@/lib/stellar"

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  trades?: number
}

export interface SubgraphTrade {
  id: string
  isBuy: boolean
  ethAmount: string
  tokenAmount: string
  price: string
  timestamp: string
  txHash: string
  trader?: string
}

// Dummy address used for read-only contract calls
const DUMMY_CALLER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"

const PRICE_PRECISION = 1e8

export function useSubgraphPriceHistory(
  tokenAddress: string | null,
  _timeframe: string = "1D",
  pollingInterval: number = 10000
) {
  const [candleData] = useState<CandleData[]>([])
  const [recentTrades] = useState<SubgraphTrade[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPriceData = useCallback(async (isInitial = false) => {
    if (!tokenAddress) {
      setCurrentPrice(0)
      setIsLoading(false)
      return
    }

    if (isInitial) {
      setIsLoading(true)
    }

    try {
      const bondingCurveId = CONTRACT_IDS.bondingCurve
      if (bondingCurveId) {
        const price = await callContract(
          bondingCurveId,
          "get_current_price",
          [toScVal(tokenAddress, 'address')],
          DUMMY_CALLER
        )

        if (price && Number(price) > 0) {
          setCurrentPrice(Number(price) / PRICE_PRECISION)
        }
      }

      setLastUpdate(Date.now())
    } catch (error) {
      console.error("[PriceHistory] Error fetching price:", error)
    } finally {
      setIsLoading(false)
    }
  }, [tokenAddress])

  // Initial fetch
  useEffect(() => {
    fetchPriceData(true)
  }, [fetchPriceData])

  // Set up polling for live price updates
  useEffect(() => {
    if (!tokenAddress || pollingInterval <= 0) return

    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(() => {
      fetchPriceData(false)
    }, pollingInterval)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [tokenAddress, pollingInterval, fetchPriceData])

  // Listen for trade confirmation events
  useEffect(() => {
    if (!tokenAddress || typeof window === "undefined") return

    const handleTradeConfirmed = (event: CustomEvent<{ tokenAddress: string }>) => {
      if (event.detail.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase()) {
        setTimeout(() => {
          fetchPriceData(false)
        }, 2000)
      }
    }

    window.addEventListener("tradeConfirmed", handleTradeConfirmed as EventListener)
    return () => {
      window.removeEventListener("tradeConfirmed", handleTradeConfirmed as EventListener)
    }
  }, [tokenAddress, fetchPriceData])

  return {
    candleData,
    recentTrades,
    currentPrice,
    isLoading,
    lastUpdate,
    refetch: () => fetchPriceData(false),
  }
}

// Hook for fetching only recent trades - not available without an indexer
export function useSubgraphTrades(_tokenAddress?: string, _limit = 50, _pollingInterval = 5000) {
  const [trades] = useState<SubgraphTrade[]>([])
  const [isLoading] = useState(false)

  return { trades, isLoading, refetch: () => {} }
}
