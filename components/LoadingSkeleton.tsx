"use client";

export function TokenCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 animate-pulse">
      <div className="flex items-start gap-2.5">
        <div className="w-24 h-24 rounded-lg bg-[#1a1a1a]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#1a1a1a] rounded w-3/4" />
          <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
          <div className="h-3 bg-[#1a1a1a] rounded w-2/3" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#1a1a1a] rounded w-16" />
          <div className="h-4 bg-[#1a1a1a] rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function PortfolioCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-xl p-5 border border-[#2a2a2a] animate-pulse">
      <div className="h-4 bg-[#2a2a2a] rounded w-24 mb-2" />
      <div className="h-8 bg-[#2a2a2a] rounded w-32 mb-1" />
      <div className="h-3 bg-[#2a2a2a] rounded w-20" />
    </div>
  );
}

export function GraphSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] animate-pulse">
      <div className="h-5 bg-[#2a2a2a] rounded w-32 mb-4" />
      <div className="h-[400px] bg-[#0d0d0d] rounded" />
    </div>
  );
}

