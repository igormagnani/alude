"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { PRESS_KIT } from "@/data/galeria";

const entrada = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visivel: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * O dia seguinte: depois da noite inteira, a única tela clara do site.
 * A foto de céu aberto (a festa de dia) sustenta o convite ao contratante.
 */
export function Booking() {
  const reduced = useReducedMotion();
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden bg-areia px-6 text-center">
      <Image
        src="/galeria/ceu-aberto.webp"
        alt=""
        fill
        className="object-cover object-[68%_52%]"
        sizes="100vw"
      />
      {/* véu de areia: a foto vira luz da manhã sem perder presença */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(240,230,215,0.42)_0%,rgba(240,230,215,0.3)_45%,rgba(240,230,215,0.66)_100%)]" />
      <motion.div
        className="relative flex flex-col items-center gap-9"
        initial={reduced ? false : "hidden"}
        whileInView="visivel"
        viewport={{ once: true, amount: 0.35 }}
        transition={{ staggerChildren: 0.09 }}
      >
        <motion.p
          variants={entrada}
          transition={{ type: "spring", duration: 0.55, bounce: 0 }}
          className="text-[11px] uppercase tracking-[0.4em] text-breu/70"
        >
          Booking
        </motion.p>
        <motion.h2
          variants={entrada}
          transition={{ type: "spring", duration: 0.55, bounce: 0 }}
          className="display max-w-5xl text-[clamp(1.6rem,6.4vw,5.6rem)] text-breu"
        >
          Quer essa energia
          <br />
          no seu evento?
        </motion.h2>
        <motion.p
          variants={entrada}
          transition={{ type: "spring", duration: 0.55, bounce: 0 }}
          className="max-w-xl text-base font-medium leading-relaxed text-breu/80"
        >
          Do warmup que enche a casa ao set que ninguém quer que acabe. Chama no direct que a
          conversa começa por lá.
        </motion.p>
        <motion.div
          variants={entrada}
          transition={{ type: "spring", duration: 0.55, bounce: 0 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="https://www.instagram.com/aludemusic/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-breu px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-areia transition-transform hover:scale-[1.04] active:scale-[0.98]"
          >
            Chamar no Instagram
          </a>
          <a
            href="https://www.enkoremusic.com/alude"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-breu/40 px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-breu transition-colors hover:border-breu hover:bg-breu/5 active:scale-[0.98]"
          >
            Booking via Enkore
          </a>
          <a
            href={PRESS_KIT}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-breu/40 px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-breu transition-colors hover:border-breu hover:bg-breu/5 active:scale-[0.98]"
          >
            Press kit
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="border-t border-areia/10 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <Image src="/brand/logo-cor.png" alt="ALUDE" width={240} height={118} className="h-auto w-24" />
        <div className="flex gap-7 text-[10px] uppercase tracking-[0.3em] text-areia/55">
          <a href="https://www.instagram.com/aludemusic/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ambar">Instagram</a>
          <a href="https://open.spotify.com/artist/0y1hTVsxI6ZHval2nbIZJH" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ambar">Spotify</a>
          <a href="https://soundcloud.com/aludeoficial" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ambar">SoundCloud</a>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-areia/35">Rio de Janeiro</p>
      </div>
    </footer>
  );
}
