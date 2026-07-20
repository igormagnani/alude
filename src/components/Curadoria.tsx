"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function Curadoria() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={ref} className="bg-[#0e0d08] py-[16vh]">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-[0.9fr_1.1fr]">
        <motion.div style={reduced ? undefined : { rotate, y }} className="mx-auto w-full max-w-sm">
          <a
            href="https://open.spotify.com/playlist/4oLS2eis2vrqureHU36hhy"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir a playlist Jazz House no Spotify"
            className="block"
          >
            <Image
              src="/brand/jazz-house-capa.jpg"
              alt="Capa da playlist Jazz House, seleção do Alude"
              width={1000}
              height={1000}
              className="h-auto w-full shadow-[0_40px_120px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:scale-[1.03]"
            />
          </a>
        </motion.div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: "var(--dourado)" }}>
            Curadoria · Alude Selection
          </p>
          <h2 className="display mt-5 text-[clamp(2rem,5vw,4rem)]">
            O som que fica
            <br />
            com você
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-areia/80">
            58 faixas de jazz house escolhidas a dedo, atualizadas toda semana. A sofisticação do
            jazz com o convite da pista: aperta o play e salva pra lembrar dele sempre que tocar.
          </p>
          <div className="mt-8 max-w-md">
            <iframe
              title="Playlist Jazz House, seleção do Alude, no Spotify"
              src="https://open.spotify.com/embed/playlist/4oLS2eis2vrqureHU36hhy?theme=0"
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
