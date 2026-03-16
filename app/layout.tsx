import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Provider";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StellaPerps - Decentralized Perpetual Trading on Stellar Network",
    template: "%s | StellaPerps",
  },
  description:
    "StellaPerps is the leading decentralized perpetual trading platform (DEX) on Stellar Network. Trade crypto with up to 100x leverage, create tokens, copy trade top traders, and earn rewards. The best perps DEX on Stellar.",
  keywords: [
    "StellaPerps",
    "Stella Perps",
    "pickle",
    "perps",
    "perpetual trading",
    "decentralized exchange",
    "DEX",
    "Stellar",
    "Stellar Network",
    "Stellar DEX",
    "Soroban",
    "crypto trading",
    "leverage trading",
    "100x leverage",
    "copy trading",
    "DeFi",
    "decentralized finance",
    "token trading",
    "perpetuals",
    "futures trading",
    "crypto derivatives",
    "XLM",
  ],
  authors: [{ name: "StellaPerps Team" }],
  creator: "StellaPerps",
  publisher: "StellaPerps",
  metadataBase: new URL("https://stellaperps.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stellaperps.com",
    siteName: "StellaPerps",
    title: "StellaPerps - Decentralized Perpetual Trading on Stellar Network",
    description:
      "Trade crypto perpetuals with up to 100x leverage on Stellar Network. Create tokens, copy trade, and earn rewards on the leading Stellar DEX.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StellaPerps - Decentralized Perpetual Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StellaPerps - Decentralized Perpetual Trading on Stellar",
    description:
      "Trade crypto perpetuals with up to 100x leverage on Stellar Network. The leading perps DEX on Stellar.",
    images: ["/og-image.png"],
    creator: "@StellaPerps",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "DeFi",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "StellaPerps",
  alternateName: ["Stella Perps", "Pickle", "Perps"],
  description:
    "StellaPerps is the leading decentralized perpetual trading platform (DEX) on Stellar Network. Trade crypto with up to 100x leverage.",
  url: "https://stellaperps.com",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1000",
  },
  provider: {
    "@type": "Organization",
    name: "StellaPerps",
    url: "https://stellaperps.com",
    logo: "https://stellaperps.com/pickle-perps-logo.png",
    sameAs: [
      "https://twitter.com/StellaPerps",
      "https://discord.gg/stellaperps",
      "https://t.me/stellaperps",
    ],
  },
  keywords:
    "stella, perps, stellaperps, perpetual trading, DEX, Stellar, Stellar Network, Stellar DEX, Soroban, crypto trading, leverage trading, DeFi, XLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
