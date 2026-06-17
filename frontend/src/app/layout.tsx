import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "CROKED — ML-Powered Indian Stock Market Analytics",
  description:
    "ML-powered stock trend analysis for NSE and BSE Indian equities, F&O, and commodities. Features XGBoost + LSTM ensemble predictions, FII/DII institutional flow tracking, real-time sentiment analysis, and technical indicators.",
  keywords: ["Indian stock market", "NSE", "BSE", "stock prediction", "ML analytics", "FII DII", "NIFTY 50", "SENSEX", "technical analysis", "XGBoost", "LSTM"],
  authors: [{ name: "CROKED" }],
  openGraph: {
    title: "CROKED — Indian Stock Market ML Analytics",
    description: "ML-powered stock trend forecasting for NSE and BSE equities, F&O, and commodities.",
    type: "website",
    locale: "en_IN",
    siteName: "CROKED",
  },
  twitter: {
    card: "summary_large_image",
    title: "CROKED — Indian Stock Market ML Analytics",
    description: "ML-powered stock trend forecasting for NSE and BSE equities, F&O, and commodities.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "application-name": "CROKED",
    "msapplication-TileColor": "#0f172a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-[#fefdfb] via-[#faf6f0] to-[#f4ebe1] text-stone-900">
        {children}
      </body>
    </html>
  );
}
