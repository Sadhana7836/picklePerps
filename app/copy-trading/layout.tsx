import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copy Trading",
  description:
    "Copy trade top performers on StellaPerps. Automatically mirror the trades of successful traders on Stellar Network and earn profits.",
  keywords: [
    "copy trading",
    "copy trade",
    "social trading",
    "mirror trading",
    "StellaPerps copy",
    "Stellar copy trading",
  ],
  openGraph: {
    title: "Copy Trading | StellaPerps",
    description:
      "Automatically copy the trades of top performers on StellaPerps Stellar DEX.",
  },
};

export default function CopyTradingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
