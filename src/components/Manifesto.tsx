"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useScroller } from "./Scroller";

const LINES = [
  { text: "A música de sempre toca em todo lugar.", accent: false },
  { text: "A sua próxima preferida toca aqui.", accent: true },
  { text: "Nem eu sabia qual seria.", accent: false },
];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start 0.9", "end 0.35"] });

  return (
    <section ref={ref} className="bg-breu px-6 py-[22vh] md:py-[26vh]">
      <div className="mx-auto max-w-6xl">
        {LINES.map((l, i) => (
          <Line
            key={l.text}
            progress={scrollYProgress}
            index={i}
            total={LINES.length}
            reduced={!!reduced}
            {...l}
          />
        ))}
      </div>
    </section>
  );
}

function Line({
  progress,
  index,
  total,
  text,
  accent,
  reduced,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  index: number;
  total: number;
  text: string;
  accent: boolean;
  reduced: boolean;
}) {
  // escalona dentro dos primeiros 70%, sobra 30% pro fade da última linha caber inteiro
  const start = total > 1 ? (index / (total - 1)) * 0.7 : 0;
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
