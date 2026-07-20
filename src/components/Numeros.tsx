"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const ITEMS = [
  { n: "500", unit: "mil", label: "streams da primeira faixa, e contando" },
  { n: "1.000", unit: "pessoas", label: "o tamanho da noite no Vista Joá" },
  { n: "8", unit: "horas", label: "o set que atravessa a madrugada" },
  { n: "6", unit: "estados", label: "do Rio a Santa Catarina, sem contar o Chile" },
];

export function Numeros() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [travel, setTravel] = useState(0);

  // quanto a faixa precisa andar pro ÚLTIMO item terminar inteiro na tela
  useEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      const ultimo = t.lastElementChild as HTMLElement | null;
      if (!ultimo) return;
      const respiro = window.innerWidth * 0.07; // mesmo padding lateral do track
      const fim = ultimo.offsetLeft + ultimo.offsetWidth + respiro;
      setTravel(Math.max(0, fim - window.innerWidth));
    };
    measure();
    const id = window.setTimeout(measure, 500); // depois das fontes
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // sticky: o trecho horizontal só acontece com a seção ocupando a tela
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.08, 0.92], [0, -travel]);

  if (reduced) {
    return (
      <section className="bg-noite px-6 py-[16vh]">
        <div className="mx-auto flex max-w-5xl flex-col gap-14">
          {ITEMS.map((it) => (
            <Item key={it.label} {...it} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[280vh] bg-noite">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-24 px-[7vw] md:gap-40">
          {ITEMS.map((it) => (
            <Item key={it.label} {...it} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Item({ n, unit, label }: { n: string; unit: string; label: string }) {
  return (
    <div className="shrink-0">
      <p className="display leading-none text-[clamp(4rem,13vw,11rem)] text-areia">
        {n}
        <span className="ml-4 align-baseline text-ambar text-[clamp(1.3rem,3vw,2.6rem)]">
          {unit}
        </span>
      </p>
      <p className="mt-4 max-w-md text-xs uppercase tracking-[0.22em] text-areia/55 md:text-sm">
        {label}
      </p>
    </div>
  );
}
