import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monitor",
  description:
    "Monitor wallets and trades in real-time on StellaPerps. Track whale movements, smart money, and trading activity on Stellar Network.",
  keywords: [
    "wallet monitor",
    "whale tracker",
    "trade monitor",
    "StellaPerps monitor",
    "Stellar tracker",
  ],
  openGraph: {
    title: "Monitor | StellaPerps",
    description:
      "Monitor wallets and track trading activity in real-time on StellaPerps.",
  },
};

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
