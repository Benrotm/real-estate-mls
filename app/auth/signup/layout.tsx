import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Înregistrare Imobum | Primește Credite Cadou",
  description: "Creează un cont pe Imobum folosind link-ul de recomandare și primești credite cadou pentru a folosi instrumentele noastre AI de evaluare și analiză.",
  openGraph: {
    title: "Înregistrare Imobum | Primește Credite Cadou",
    description: "Creează un cont pe Imobum folosind link-ul de recomandare și primești credite cadou pentru a folosi instrumentele noastre AI de evaluare și analiză.",
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
    title: "Înregistrare Imobum | Primește Credite Cadou",
    description: "Creează un cont pe Imobum folosind link-ul de recomandare și primești credite cadou pentru a folosi instrumentele noastre AI de evaluare și analiză.",
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
