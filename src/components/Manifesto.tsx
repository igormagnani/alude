"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

const LINES = [
  { text: "Ninguém lembra da faixa das duas da manhã.", accent: false },
  { text: "Todo mundo lembra da noite.", accent: true },
  { text: "Meu trabalho é a noite inteira.", accent: false },
];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.35"] });

  return (
    <section ref={ref} className="bg-breu px-6 py-[22vh] md:py-[26vh]">
      <div className="mx-auto max-w-6xl">
        {LINES.map((l, i) => (
          <Line key={l.text} progress={scrollYProgress} index={i} reduced={!!reduced} {...l} />
        ))}
      </div>
    </section>
  );
}

function Line({
  progress,
  index,
  text,
  accent,
  reduced,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  index: number;
  text: string;
  accent: boolean;
  reduced: boolean;
}) {
  const start = index * 0.18;
  const opacity = useTransform(progress, [start, start + 0.3], [0.12, 1]);
  const y = useTransform(progress, [start, start + 0.3], [26, 0]);
  const cls = `display text-[clamp(1.9rem,5.6vw,4.6rem)] ${accent ? "text-ambar" : "text-areia"}`;
  if (reduced) return <p className={cls}>{text}</p>;
  return (
    <motion.p style={{ opacity, y }} className={cls}>
      {text}
    </motion.p>
  );
}
