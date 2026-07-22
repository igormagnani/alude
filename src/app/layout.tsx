import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Scroller } from "@/components/Scroller";
import { TagsDeMedicao, GtmNoScript } from "@/components/Analytics";
import { JSON_LD, SITE_URL } from "@/lib/site";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ALUDE · O anfitrião da boa música no Rio",
  description:
    "DJ e produtor carioca de palcos grandes. Do warmup ao after: qualquer pista, uma experiência.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "ALUDE",
    title: "ALUDE",
    description: "O anfitrião da boa música no Rio. Do warmup ao after.",
    images: [{ url: "/brand/hero-poster.jpg", width: 1920, height: 1072, alt: "Alude no palco" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALUDE",
    description: "O anfitrião da boa música no Rio. Do warmup ao after.",
    images: ["/brand/hero-poster.jpg"],
  },
  // preencha quando o Search Console gerar o token (ou verifique por DNS e ignore isto)
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <TagsDeMedicao />
      </head>
      <body className="h-full overflow-hidden">
        <GtmNoScript />
        <script
          type="application/ld+json"
          // conteúdo é nosso e estático, não vem de entrada de usuário
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <Scroller>{children}</Scroller>
      </body>
    </html>
  );
}
