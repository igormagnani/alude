import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { Numeros } from "@/components/Numeros";
import { Sol } from "@/components/Sol";
import { Festas } from "@/components/Festas";
import { Galeria } from "@/components/Galeria";
import { Curadoria } from "@/components/Curadoria";
import { Faixa } from "@/components/Faixa";
import { Booking, Rodape } from "@/components/Booking";
import { AudioToggle } from "@/components/AudioToggle";
import { Consentimento } from "@/components/Consentimento";

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <Manifesto />
      <Numeros />
      <Sol />
      <Festas />
      <Galeria />
      <Curadoria />
      <Faixa />
      <Booking />
      <Rodape />
      <AudioToggle />
      <Consentimento />
    </main>
  );
}
