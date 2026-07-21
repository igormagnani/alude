"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useScroller } from "./Scroller";

export function Faixa() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section ref={ref} className="relative overflow-hidden py-[18vh]">
      <motion.div style={reduced ? undefined : { y }} className="absolute -inset-y-[14%] inset-x-0">
        <Image
          src="/brand/letreiro.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.22]"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-noite via-noite/70 to-noite" />

      <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">A faixa</p>
          <h2 className="display mt-5 text-[clamp(2.2rem,6vw,4.6rem)]">
            Meio milhão
            <br />
            de plays
          </h2>
        </div>
        <div>
          <p className="max-w-md text-base leading-relaxed text-areia/85">
            500 mil vezes essa faixa tocou em algum fone, algum carro, alguma festa por aí.
            Obrigado por isso. De verdade.
          </p>
          <div className="mt-7">
            <iframe
              title="The Lion Sleeps Tonight, remix do Alude, no Spotify"
              src="https://open.spotify.com/embed/track/47VV43E2Rpdl4lkX5gk8fL?theme=0"
              width="100%"
              height="152"
              frameBorder="0"
              loading="lazy"
              allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
