"use client"

import { useState } from "react"
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react"
import { formatAmount } from "@/lib/soroban"
import { PageLayout } from "@/components/PageLayout"
type SortBy = "pnl" | "trades" | "volume" | "winRate"
type TimeFrame = "1D" | "7D" | "30D"

interface Trader {
  address: string
  totalTrades: number
  totalBuys: number
  totalSells: number
  totalVolumeTraded: bigint
  totalPositions: number
  openPositions: number
  totalPnl: bigint
  winCount: number
  lossCount: number
  liquidationCount: number
  rank: number
}

export default function LeaderboardPage() {
  const [traders, setTraders] = useState<Trader[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy] = useState<SortBy>("trades")
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("All")

  const tabs = ["All", "Top PnL", "Top Volume", "Top Win Rate", "Most Active"]

  const filteredTraders = traders.filter(trader => {
    if (!searchQuery) return true
    return trader.address.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatPnl = (pnl: bigint) => {
    const value = parseFloat(formatAmount(pnl))
    return {
      value,
      formatted: `${value >= 0 ? "+" : ""}${value.toFixed(2)}`,
      isPositive: value >= 0,
    }
  }

  const formatVolume = (vol: bigint) => {
    const value = parseFloat(formatAmount(vol))
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(2)}`
  }

  return (
    <PageLayout title="Leaderboard">

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 bg-[#111] border border-[#1a1a1a] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#333]"
            />
          </div>

          {/* Time Frame */}
          <div className="flex items-center bg-[#111] border border-[#1a1a1a] rounded">
            {(["1D", "7D", "30D"] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`px-2.5 py-1.5 text-xs transition-colors ${
                  timeFrame === tf
                    ? "bg-[#1a1a1a] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#0d0d0d] border-b border-[#1a1a1a] text-[11px] text-gray-500 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Wallet</div>
          <div className="col-span-2 text-right">{timeFrame} PnL</div>
          <div className="col-span-1 text-right">Win Rate</div>
          <div className="col-span-2 text-right">Trades (B/S)</div>
          <div className="col-span-2 text-right">Volume</div>
          <div className="col-span-1 text-right">Positions</div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : filteredTraders.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No traders found</p>
            <p className="text-xs text-gray-500 mt-1">Subgraph may still be syncing</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {filteredTraders.map((trader) => {
              const pnl = formatPnl(trader.totalPnl)
              const totalClosed = trader.winCount + trader.lossCount
              const winRate = totalClosed > 0 ? (trader.winCount / totalClosed) * 100 : 0

              return (
                <div
                  key={trader.address}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#111] transition-colors items-center"
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    {trader.rank <= 3 ? (
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        trader.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                        trader.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                        "bg-orange-600/20 text-orange-500"
                      }`}>
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">{trader.rank}</span>
                    )}
                  </div>

                  {/* Wallet */}
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {trader.address.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm text-white font-medium">
                        {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* PnL */}
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-medium flex items-center justify-end gap-1 ${
                      pnl.isPositive ? "text-green-500" : "text-red-500"
                    }`}>
                      {pnl.isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {pnl.formatted} XLM
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-1 text-right">
                    <span className={`text-sm ${winRate >= 50 ? "text-green-500" : "text-yellow-500"}`}>
                      {winRate.toFixed(1)}%
                    </span>
                  </div>

                  {/* Trades */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-white">{trader.totalTrades}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      (<span className="text-green-500">{trader.totalBuys}</span>/<span className="text-red-500">{trader.totalSells}</span>)
                    </span>
                  </div>

                  {/* Volume */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm text-green-500">
                      {formatVolume(trader.totalVolumeTraded)}
                    </span>
                  </div>

                  {/* Positions */}
                  <div className="col-span-1 text-right">
                    <span className="text-sm text-white">{trader.openPositions}</span>
                    <span className="text-xs text-gray-500">/{trader.totalPositions}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
