import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Bună! Te invit pe Imobum.com",
  description: "Imobum.com, platforma imobiliară inteligentă. Înregistrează-te folosind acest link și primești credite cadou pentru a testa instrumentele AI",
  openGraph: {
    title: "Bună! Te invit pe Imobum.com",
    description: "Imobum.com, platforma imobiliară inteligentă. Înregistrează-te folosind acest link și primești credite cadou pentru a testa instrumentele AI",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Imobum Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bună! Te invit pe Imobum.com",
    description: "Imobum.com, platforma imobiliară inteligentă. Înregistrează-te folosind acest link și primești credite cadou pentru a testa instrumentele AI",
    images: ["/icon.png"],
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
