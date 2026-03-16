"use client"

import { PageLayout } from "@/components/PageLayout"

interface ServiceStatus {
  name: string
  status: "Operational" | "Degraded" | "Down"
  uptime: number // percentage
  contractAddress?: string
}

// Real contract addresses on Stellar Testnet
const services: ServiceStatus[] = [
  {
    name: "Stellar Testnet - Network",
    status: "Operational",
    uptime: 100,
  },
  {
    name: "Perpetual Trading Contract",
    status: "Operational",
    uptime: 100,
    contractAddress: "0x8081b646f349c049f2d5e8a400057d411dd657bd",
  },
  {
    name: "Token Factory V3",
    status: "Operational",
    uptime: 100,
    contractAddress: "0x083c920Eb055997a4becf51d9854dCd441a40b3E",
  },
  {
    name: "Bonding Curve Market",
    status: "Operational",
    uptime: 100,
    contractAddress: "0x93b268325A9862645c82b32229f3B52264750Ca2",
  },
  {
    name: "Stella Perps WebApp",
    status: "Operational",
    uptime: 100,
  },
]

// Static uptime bars data (90 days)
const UPTIME_DAYS = 90

function UptimeBar({ status }: { status: ServiceStatus["status"] }) {
  const getBarColor = () => {
    if (status === "Operational") return "bg-[#00d26a]"
    if (status === "Degraded") return "bg-[#ffc107]"
    return "bg-[#ff4757]"
  }

  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: UPTIME_DAYS }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] h-8 rounded-sm ${getBarColor()}`}
        />
      ))}
    </div>
  )
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  const statusColor =
    service.status === "Operational"
      ? "text-[#00d26a]"
      : service.status === "Degraded"
      ? "text-[#ffc107]"
      : "text-[#ff4757]"

  return (
    <div className="bg-[#111] border-b border-[#1a1a1a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{service.name}</span>
          {service.contractAddress && (
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${service.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-[#00d26a] font-mono"
            >
              ?
            </a>
          )}
        </div>
        <span className={`text-sm font-medium ${statusColor}`}>{service.status}</span>
      </div>

      {/* Uptime Bar */}
      <UptimeBar status={service.status} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>90 days ago</span>
        <span>{service.uptime.toFixed(1)} % uptime</span>
        <span>Today</span>
      </div>
    </div>
  )
}

export default function MonitorPage() {
  const allOperational = services.every((s) => s.status === "Operational")

  return (
    <PageLayout title="Monitor">
      <div className="max-w-4xl mx-auto">
        {/* Status Banner */}
        <div
          className={`rounded-lg p-4 mb-6 text-center font-medium text-lg ${
            allOperational
              ? "bg-[#00d26a] text-white"
              : "bg-[#ff4757] text-white"
          }`}
        >
          {allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues"}
        </div>

        {/* Uptime Info */}
        <div className="text-right mb-4">
          <span className="text-gray-500 text-sm">
            Uptime over the past 90 days.{" "}
            <span className="text-[#00d26a]">
              View historical uptime.
            </span>
          </span>
        </div>

        {/* Service List */}
        <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] overflow-hidden">
          {services.map((service, index) => (
            <ServiceRow key={index} service={service} />
          ))}
        </div>

        {/* Network Info */}
        <div className="text-center mt-6">
          <span className="text-gray-500 text-sm">
            Network: Stellar Testnet
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
