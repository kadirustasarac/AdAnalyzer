import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Ad Optimizer",
  description: "Campaign optimization platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#131722] text-[#d1d4dc]">
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
