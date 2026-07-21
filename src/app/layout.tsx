import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Scroller } from "@/components/Scroller";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://alude.vercel.app"),
  title: "ALUDE · O anfitrião da música boa no Rio",
  description:
    "DJ e produtor carioca de palcos grandes. Do warmup ao after: qualquer pista, uma experiência.",
  openGraph: {
    title: "ALUDE",
    description: "O anfitrião da música boa no Rio. Do warmup ao after.",
    images: ["/brand/hero-poster.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${inter.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden">
        <Scroller>{children}</Scroller>
      </body>
    </html>
  );
}
