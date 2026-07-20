"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function Sol() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.16, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  // só toca quando está na tela (poupa bateria e CPU)
  useEffect(() => {
    const el = ref.current;
    const v = videoRef.current;
    if (!el || !v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative h-svh overflow-hidden bg-breu">
      <motion.div style={reduced ? undefined : { scale, y }} className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-70"
          src="/media/sol-vertical.mp4"
          poster="/media/sol-poster.jpg"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-breu via-breu/25 to-breu/60" />
      <div className="absolute bottom-[10vh] left-6 max-w-lg md:left-[8vw]">
        <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">
          Sol da Meia Noite · Vista Joá
        </p>
        <p className="mt-5 text-base leading-relaxed text-areia/85 md:text-lg">
          Mil pessoas, oito horas, a cidade inteira lá embaixo. A trilha é dançante, cantada,
          groovada: música extrovertida, feita pra você olhar pro lado e puxar assunto. O Alude
          é presença de casa, do warmup ao after.
        </p>
      </div>
    </section>
  );
}
