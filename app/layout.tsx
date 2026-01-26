import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomAuthBar from "./components/BottomAuthBar";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import { getUserProfile } from "./lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imobum | Premium Real Estate & Valuation",
  description: "Advanced Real Estate Marketplace with AI Price Valuation",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserProfile();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <LanguageProvider>
          <Navbar user={user} />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
          <BottomAuthBar user={user} />
        </LanguageProvider>
      </body>
    </html>
  );
}
