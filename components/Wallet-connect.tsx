"use client"

import { useStellarWallet } from "@/contexts/StellarContext"
import { Wallet } from "lucide-react"

export function WalletConnect() {
  const { isConnected, address, balance, connect, disconnect } = useStellarWallet()

  if (isConnected && address) {
    return (
      <div className="flex justify-center">
        <button
          onClick={disconnect}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Wallet className="w-4 h-4 text-[#00d26a]" />
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          {balance && <span className="text-[#00d26a] text-xs ml-1">{parseFloat(balance).toFixed(2)} XLM</span>}
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={connect}
        className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-white text-sm px-4 py-2 rounded-lg transition-colors"
      >
        <Wallet className="w-4 h-4 text-[#00d26a]" />
        Connect Wallet
      </button>
    </div>
  )
}
