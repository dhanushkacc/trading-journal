import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Journal – Track & Analyze Your Trades",
  description:
    "A premium trading journal application to log trades, capture chart screenshots, and track performance with powerful filtering and scenario analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
