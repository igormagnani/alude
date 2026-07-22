"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useScroller } from "./Scroller";

export function Sol() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start end", "end start"] });
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
          className="h-full w-full object-cover object-[50%_25%]"
          src="/media/sol-vertical.mp4"
          poster="/media/sol-poster.jpg"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        />
      </motion.div>
      {/* escurece só onde o texto vive; no topo o vídeo aparece limpo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(5,6,10,0.96) 0%, rgba(5,6,10,0.88) 14%, rgba(5,6,10,0.58) 32%, rgba(5,6,10,0.24) 52%, rgba(5,6,10,0.06) 74%, rgba(5,6,10,0.16) 100%)",
        }}
      />
      <div className="absolute bottom-[10vh] left-6 max-w-lg md:left-[8vw]">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-ambar">
          Sol da Meia Noite · Vista Joá
        </h2>
        <p className="mt-5 text-base leading-relaxed text-areia/85 md:text-lg">
          Mais de mil pessoas, 8 horas, a cidade inteira lá embaixo. A trilha é dançante, cantada,
          groovada: música extrovertida, feita pra você olhar pro lado e puxar assunto. O Alude
          é presença e autenticidade, do warmup ao after.
        </p>
      </div>
    </section>
  );
}
