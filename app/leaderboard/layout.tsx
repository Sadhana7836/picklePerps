import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "View top traders on StellaPerps leaderboard. See rankings, PnL, win rates, and trading volumes of the best performers on Stellar Network.",
  keywords: [
    "trading leaderboard",
    "top traders",
    "StellaPerps leaderboard",
    "crypto rankings",
    "Stellar traders",
  ],
  openGraph: {
    title: "Leaderboard | StellaPerps",
    description:
      "See the top performing traders on StellaPerps Stellar DEX leaderboard.",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
