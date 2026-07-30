import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomAuthBar from "./components/BottomAuthBar";
import SafariDOMFix from "./components/SafariDOMFix";
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
  description: "Platformă imobiliară inteligentă. Găsește proprietăți premium și evaluează-le folosind inteligența artificială.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.imobum.com"),
  openGraph: {
    title: "Imobum | Premium Real Estate & Valuation",
    description: "Platformă imobiliară inteligentă. Găsește proprietăți premium și evaluează-le folosind inteligența artificială.",
    url: "https://www.imobum.com",
    siteName: "Imobum",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Imobum Logo",
      },
    ],
    locale: "ro_RO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imobum | Premium Real Estate & Valuation",
    description: "Platformă imobiliară inteligentă. Găsește proprietăți premium și evaluează-le folosind inteligența artificială.",
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.85,
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
          <SafariDOMFix />
          <Navbar user={user} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <BottomAuthBar user={user} />
        </LanguageProvider>
      </body>
    </html>
  );
}
