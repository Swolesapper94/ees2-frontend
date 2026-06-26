import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DevAuthProvider } from "@/lib/dev-auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "EES 2.0",
  description: "Modern, soldier-focused Army evaluation system.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <DevAuthProvider>{children}</DevAuthProvider>
      </body>
    </html>
  );
}
