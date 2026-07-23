"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { SERIES_ATIVAS } from "@/data/playlists";
import { useScroller } from "./Scroller";

/**
 * Vitrine da curadoria: cena full-bleed (a pista atrás) com a capa em destaque
 * e a prateleira da série embaixo. Clicar numa capa da prateleira coloca ela
 * no destaque, com o player junto.
 */
export function Curadoria() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [ativa, setAtiva] = useState(0);
  const [sel, setSel] = useState(0);
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 3.5]);
  const y = useTransform(scrollYProgress, [0, 1], [46, -46]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const serie = SERIES_ATIVAS[ativa] ?? SERIES_ATIVAS[0];
  if (!serie) return null;
  const destaque = serie.playlists[sel] ?? serie.playlists[0];

  return (
    <section ref={ref} className="relative overflow-hidden py-[18vh]">
      {/* a pista é o cenário: a curadoria não acontece no vácuo */}
      <motion.div style={reduced ? undefined : { y: bgY }} className="absolute -inset-y-[8%] inset-x-0">
        <Image
          src="/galeria/de-costas.webp"
          alt=""
          fill
          className="object-cover object-[50%_30%]"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-breu/78" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_38%_55%,transparent_20%,rgba(5,6,10,0.55)_78%)]" />
      {/* costura com o ato: a cena emerge do escuro em vez de nascer numa borda */}
      <div className="absolute inset-x-0 top-0 h-[24vh] bg-gradient-to-b from-noite to-transparent" />

      {/* distorção de vinil: o warp de segurar o disco contra a luz */}
      <svg aria-hidden className="absolute h-0 w-0">
        <filter id="vinil-warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="1" result="n" seed="7" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="relative mx-auto max-w-6xl px-6">
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
                  onClick={() => {
                    setAtiva(i);
                    setSel(0);
                  }}
                  className={`border px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] transition-colors active:scale-[0.98] ${
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

        <div className="mt-14 grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          <motion.div style={reduced ? undefined : { rotate, y }} className="mx-auto w-full max-w-md md:max-w-lg">
            <a
              href={`https://open.spotify.com/playlist/${destaque.spotifyId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir a playlist ${destaque.nome} no Spotify`}
              className="group block"
            >
              <Image
                key={destaque.spotifyId}
                src={destaque.capa}
                alt={`Capa da playlist ${destaque.nome}, seleção do Alude`}
                width={1000}
                height={1000}
                className="h-auto w-full shadow-[0_60px_160px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-[1.025] group-hover:[filter:url(#vinil-warp)] motion-reduce:group-hover:[filter:none]"
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
                key={destaque.spotifyId}
                title={`Playlist ${destaque.nome}, seleção do Alude, no Spotify`}
                src={`https://open.spotify.com/embed/playlist/${destaque.spotifyId}?theme=0`}
                width="100%"
                height="152"
                frameBorder="0"
                loading="lazy"
                allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          </div>
        </div>

        {/* a prateleira da série: cada capa é um disco ao alcance da mão */}
        {serie.playlists.length > 1 ? (
          <div className="mt-14">
            <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-areia/45">
              Toda a série {serie.nome}
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
              {serie.playlists.map((p, i) => (
                <button
                  key={p.spotifyId}
                  type="button"
                  onClick={() => setSel(i)}
                  aria-label={`Colocar a playlist ${p.nome} em destaque`}
                  aria-pressed={i === sel}
                  className={`group relative block overflow-hidden transition-transform active:scale-[0.97] ${
                    i === sel ? "ring-2 ring-dourado" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={p.capa}
                    alt={`Capa da playlist ${p.nome}`}
                    width={400}
                    height={400}
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.05] group-hover:[filter:url(#vinil-warp)] motion-reduce:group-hover:[filter:none]"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
