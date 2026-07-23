import { AtoAbertura } from "@/components/AtoAbertura";
import { Curadoria } from "@/components/Curadoria";
import { Sol } from "@/components/Sol";
import { Galeria } from "@/components/Galeria";
import { Faixa } from "@/components/Faixa";
import { Manifesto } from "@/components/Manifesto";
import { Festas } from "@/components/Festas";
import { Booking, Rodape } from "@/components/Booking";
import { AudioToggle } from "@/components/AudioToggle";
import { Consentimento } from "@/components/Consentimento";
import { MetaPixel } from "@/components/MetaPixel";

/**
 * Híbrido plano-sequência: o filme abre (AtoAbertura) e fecha (Festas 3D → Booking claro);
 * o miolo rola normal, sempre em cima de mídia.
 */
export default function Home() {
  return (
    <main className="flex flex-col">
      <AtoAbertura />
      <Curadoria />
      <Sol />
      <Galeria />
      <Faixa />
      <Manifesto />
      <Festas />
      <Booking />
      <Rodape />
      <AudioToggle />
      <Consentimento />
      <MetaPixel />
    </main>
  );
}
