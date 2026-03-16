import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Token",
  description:
    "Launch your own token on Stellar Network in seconds with StellaPerps. Create meme coins, utility tokens, and more with our easy-to-use token creator.",
  keywords: [
    "create token",
    "token creator",
    "Stellar token",
    "launch token",
    "meme coin creator",
    "StellaPerps token",
  ],
  openGraph: {
    title: "Create Token | StellaPerps",
    description:
      "Launch your own token on Stellar Network in seconds with StellaPerps token creator.",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
