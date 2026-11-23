import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GHYAMAJHA — Luxury Phone Protection",
    template: "%s | GHYAMAJHA",
  },
  description:
    "Aerospace titanium armor cases, MagSafe luxury covers, and sapphire camera screen protection.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="genz-theme min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
