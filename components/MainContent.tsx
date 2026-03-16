"use client";


import { TrenchesColumn } from "./TrenchesColumn";
import { RWAColumn } from "./RWAColumn";
import { TrendingColumn } from "./TrendingColumn";
import { TokenData } from "./TokenCard";
import { type RWAAssetConfig } from "@/lib/rwaAssets";
import { RefreshCw } from "lucide-react";
import { useMemeTokens } from "@/hooks/useMemeTokens";
import { useCallback, memo, useEffect } from "react";
import { TokenCardSkeleton } from "./LoadingSkeleton";
import { useAppActions } from "@/lib/store";

interface MainContentProps {
  onTokenSelect?: (token: TokenData) => void;
  onRWASelect?: (asset: RWAAssetConfig) => void;
}

export const MainContent = memo(function MainContent({ onTokenSelect, onRWASelect }: MainContentProps) {
  // useMemeTokens already handles auto-refresh internally via POLLING.TOKENS_REFRESH
  const { tokens: realTokens, isLoading, isRefreshing, isError, refetch } = useMemeTokens();
  const { restoreTokenFromId } = useAppActions();

  // Restore selected token from persisted ID when tokens load
  useEffect(() => {
    if (realTokens.length > 0) {
      restoreTokenFromId(realTokens);
    }
  }, [realTokens, restoreTokenFromId]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Trenches Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          {/* Chain Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-90 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><circle cx="128" cy="128" r="128" fill="#000"/><path d="M199.2 73.6l-18.4 9.6c-14.4-13.6-33.6-22.4-55.2-22.4-44 0-79.2 35.2-79.2 79.2 0 8 1.6 16 4 23.2L32 172.8V152l12-6.4c-1.6-5.6-2.4-12-2.4-18.4 0-48 38.4-86.4 86.4-86.4 24 0 45.6 9.6 61.6 25.6l9.6-4.8v11.2zm24 9.6V104l-12 6.4c1.6 5.6 2.4 12 2.4 18.4 0 48-38.4 86.4-86.4 86.4-24 0-45.6-9.6-61.6-25.6l-9.6 4.8v-11.2l18.4-9.6c14.4 13.6 33.6 22.4 55.2 22.4 44 0 79.2-35.2 79.2-79.2 0-8-1.6-16-4-23.2L224 84.8z" fill="white"/></svg>
            </button>
            <span className="text-xs text-[#888]">Stellar Testnet</span>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#1a1a1a] disabled:opacity-50"
            title="Refresh tokens"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Columns Container - Responsive: 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div className="flex-1 flex overflow-x-auto">
        {isError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-12 h-12 rounded-full bg-[#ff4757]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-white font-medium mb-2">Connection Error</p>
              <p className="text-[#555] text-sm mb-4">Failed to load tokens. Please check your connection.</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-[#00d26a] hover:bg-[#00e676] text-black text-sm font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <>
            <div className="flex flex-col h-full min-w-[280px] sm:min-w-[320px] lg:min-w-[350px] xl:min-w-[380px] flex-1 bg-[#0d0d0d] border-r border-[#1a1a1a] px-2 py-2 space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <TokenCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden md:flex flex-col h-full min-w-[280px] sm:min-w-[320px] lg:min-w-[350px] xl:min-w-[380px] flex-1 bg-[#0d0d0d] border-r border-[#1a1a1a] px-2 py-2 space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <TokenCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden lg:flex flex-col h-full min-w-[280px] sm:min-w-[320px] lg:min-w-[350px] xl:min-w-[380px] flex-1 bg-[#0d0d0d] px-2 py-2 space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <TokenCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Column 1: Tokens - always visible */}
            <TrenchesColumn
              title="Tokens"
              subtitle="All Tokens"
              tokens={realTokens}
              onTokenSelect={onTokenSelect}
            />

            {/* Column 2: RWA - hidden on mobile */}
            <RWAColumn onAssetSelect={onRWASelect} useDetailPage={!!onRWASelect} />

            {/* Column 3: Trending - hidden on mobile and tablet */}
            <TrendingColumn
              tokens={realTokens}
              onTokenSelect={onTokenSelect}
              onRWASelect={onRWASelect}
            />
          </>
        )}
      </div>
    </div>
  );
});
