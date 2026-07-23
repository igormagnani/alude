"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useScroller } from "./Scroller";

const LINES = [
  { text: "Não toco as músicas óbvias de sempre.", accent: false },
  { text: "Eu te apresento a sua próxima música preferida.", accent: true },
  { text: "Prepare-se pra se surpreender em todo set.", accent: false },
];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start 0.9", "end 0.35"] });

  return (
    <section ref={ref} className="bg-breu px-6 py-[22vh] md:py-[26vh]">
      <h2 className="sr-only">O que o Alude toca</h2>
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
  const cls = `display text-[clamp(1.9rem,5.6vw,4.6rem)] ${accent ? "text-ambar" : "text-areia"}`;
  if (reduced) return <p className={cls}>{text}</p>;
  const palavras = text.split(" ");
  return (
    <p className={cls}>
      {palavras.map((palavra, i) => (
        // o espaço fica FORA do span: sem ele o texto do servidor vira palavras coladas
        <span key={`${palavra}-${i}`}>
          <Palavra
            progress={progress}
            // cada palavra ocupa uma fatia da janela da própria linha
            start={start + (i / palavras.length) * 0.22}
            texto={palavra}
          />{" "}
        </span>
      ))}
    </p>
  );
}

function Palavra({
  progress,
  start,
  texto,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  texto: string;
}) {
  const opacity = useTransform(progress, [start, start + 0.14], [0.1, 1]);
  const y = useTransform(progress, [start, start + 0.14], [18, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block will-change-transform">
      {texto}
    </motion.span>
  );
}
