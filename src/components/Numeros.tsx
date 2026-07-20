"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const ITEMS = [
  { n: "500", unit: "mil", label: "streams da primeira faixa, e contando" },
  { n: "1.000", unit: "pessoas", label: "o tamanho da noite no Vista Joá" },
  { n: "8", unit: "horas", label: "o set que atravessa a madrugada" },
  { n: "6", unit: "estados", label: "do Rio a Santa Catarina, sem contar o Chile" },
];

export function Numeros() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["6%", "-46%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-noite py-[16vh]">
      <motion.div
        style={reduced ? undefined : { x }}
        className={`flex ${reduced ? "flex-col gap-14 px-6" : "w-max gap-24 md:gap-36"}`}
      >
        {ITEMS.map((it) => (
          <div key={it.label} className="shrink-0">
            <p className="display leading-none text-[clamp(4.5rem,15vw,13rem)] text-areia">
              {it.n}
              <span className="ml-4 align-baseline text-ambar text-[clamp(1.4rem,3.4vw,3rem)]">
                {it.unit}
              </span>
            </p>
            <p className="mt-4 max-w-md text-sm uppercase tracking-[0.22em] text-areia/55">
              {it.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
