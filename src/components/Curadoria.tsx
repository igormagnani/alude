"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { SERIES_ATIVAS } from "@/data/playlists";

export function Curadoria() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [ativa, setAtiva] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-4.5, 4.5]);
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);

  const serie = SERIES_ATIVAS[ativa] ?? SERIES_ATIVAS[0];
  if (!serie) return null;
  const destaque = serie.playlists[0];

  return (
    <section ref={ref} className="bg-[#0e0d08] py-[16vh]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: "var(--dourado)" }}>
              Curadoria · Alude Selection
            </p>
            <h2 className="display mt-5 text-[clamp(2rem,5vw,4rem)]">
              O som que fica
              <br />
              com você
            </h2>
          </div>

          {SERIES_ATIVAS.length > 1 ? (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Séries de playlist">
              {SERIES_ATIVAS.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  role="tab"
                  aria-selected={i === ativa}
                  onClick={() => setAtiva(i)}
                  className={`border px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                    i === ativa
                      ? "border-dourado text-dourado"
                      : "border-areia/20 text-areia/55 hover:border-dourado/60 hover:text-dourado/80"
                  }`}
                >
                  {s.nome}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-areia/40">
          Série {serie.nome} · {serie.tagline}
        </p>

        <div className="mt-12 grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr]">
          <motion.div style={reduced ? undefined : { rotate, y }} className="mx-auto w-full max-w-sm">
            <a
              href={`https://open.spotify.com/playlist/${destaque.spotifyId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir a playlist ${destaque.nome} no Spotify`}
              className="block"
            >
              <Image
                src={destaque.capa}
                alt={`Capa da playlist ${destaque.nome}, seleção do Alude`}
                width={1000}
                height={1000}
                className="h-auto w-full shadow-[0_40px_120px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:scale-[1.03]"
              />
            </a>
          </motion.div>

          <div>
            <h3 className="display text-2xl" style={{ color: "var(--dourado)" }}>
              {destaque.nome}
            </h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-areia/80">
              {destaque.faixas ? `${destaque.faixas} faixas. ` : ""}
              {destaque.descricao} Aperta o play e salva pra lembrar dele sempre que tocar.
            </p>
            <div className="mt-8 max-w-md">
              <iframe
                title={`Playlist ${destaque.nome}, seleção do Alude, no Spotify`}
                src={`https://open.spotify.com/embed/playlist/${destaque.spotifyId}?theme=0`}
                width="100%"
                height="152"
                frameBorder="0"
                loading="lazy"
                allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>

            {serie.playlists.length > 1 ? (
              <ul className="mt-8 flex flex-col gap-3">
                {serie.playlists.slice(1).map((p) => (
                  <li key={p.spotifyId}>
                    <a
                      href={`https://open.spotify.com/playlist/${p.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-areia/70 transition-colors hover:text-dourado"
                    >
                      {p.nome}
                      {p.faixas ? ` · ${p.faixas} faixas` : ""}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
