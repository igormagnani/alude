"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { GALERIA, PRESS_KIT, type Midia } from "@/data/galeria";
import { useScroller } from "./Scroller";

const COLUNAS_MOBILE = 2;
const COLUNAS_DESKTOP = 3;
// deslocamento de cada coluna: colunas em ritmos diferentes é o que dá profundidade
const RITMO = [-52, 26, -18];

function distribuir(itens: Midia[], colunas: number) {
  const out: Midia[][] = Array.from({ length: colunas }, () => []);
  itens.forEach((m, i) => out[i % colunas].push(m));
  return out;
}

export function Galeria() {
  const ref = useRef<HTMLElement>(null);
  const scroller = useScroller();
  const reduced = useReducedMotion();
  const [aberta, setAberta] = useState<number | null>(null);
  // uma grade só: renderizar duas (uma por breakpoint) duplicaria as 12 imagens no DOM.
  // Começa em 2 pra bater com o servidor e sobe pra 3 depois de montar.
  const [colunas, setColunas] = useState(COLUNAS_MOBILE);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setColunas(mq.matches ? COLUNAS_DESKTOP : COLUNAS_MOBILE);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start end", "end start"] });

  return (
    <section ref={ref} className="bg-noite py-[16vh]">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-ambar" aria-hidden>Registro</p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(1.9rem,5vw,4rem)]">
            A noite
            <br />
            por dentro
          </h2>
          <a
            href={PRESS_KIT}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-areia/30 px-7 py-3.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-areia transition-colors hover:border-ambar hover:text-ambar"
          >
            Press kit
          </a>
        </div>

        <div
          className="mt-12 grid gap-3 md:gap-4"
          style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
        >
          {distribuir(GALERIA, colunas).map((coluna, c) => (
            <Coluna
              key={c}
              progresso={scrollYProgress}
              deslocamento={reduced || colunas < COLUNAS_DESKTOP ? 0 : RITMO[c]}
            >
              {coluna.map((m) => (
                <Peca key={m.src} midia={m} onAbrir={() => setAberta(GALERIA.indexOf(m))} />
              ))}
            </Coluna>
          ))}
        </div>
      </div>

      {aberta !== null ? (
        <Lightbox indice={aberta} aoFechar={() => setAberta(null)} aoTrocar={setAberta} />
      ) : null}
    </section>
  );
}

function Coluna({
  progresso,
  deslocamento,
  children,
}: {
  progresso: ReturnType<typeof useScroll>["scrollYProgress"];
  deslocamento: number;
  children: React.ReactNode;
}) {
  const y = useTransform(progresso, [0, 1], [-deslocamento, deslocamento]);
  return (
    <motion.div style={{ y }} className="flex flex-col gap-4">
      {children}
    </motion.div>
  );
}

function Peca({ midia, onAbrir }: { midia: Midia; onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Ampliar: ${midia.alt}`}
      className="group relative block overflow-hidden bg-breu focus-visible:outline focus-visible:outline-2 focus-visible:outline-ambar"
    >
      <Image
        src={midia.src}
        alt={midia.alt}
        width={midia.w}
        height={midia.h}
        sizes="(min-width: 768px) 30vw, 45vw"
        className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      {/* véu sutil pra unificar as fotos com o resto do site; some no hover e no toque */}
      <span className="pointer-events-none absolute inset-0 bg-breu/15 transition-opacity duration-500 group-hover:opacity-0 group-active:opacity-0" />
    </button>
  );
}

function Lightbox({
  indice,
  aoFechar,
  aoTrocar,
}: {
  indice: number;
  aoFechar: () => void;
  aoTrocar: (i: number) => void;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const scroller = useScroller();
  const midia = GALERIA[indice];

  const irPara = useCallback(
    (passo: number) => aoTrocar((indice + passo + GALERIA.length) % GALERIA.length),
    [indice, aoTrocar]
  );

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowRight") irPara(1);
      if (e.key === "ArrowLeft") irPara(-1);
    };
    window.addEventListener("keydown", aoTeclar);

    // trava a rolagem do fundo enquanto a foto está aberta
    const alvo = scroller.current;
    const antes = alvo?.style.overflow;
    if (alvo) alvo.style.overflow = "hidden";

    const focoAnterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", aoTeclar);
      if (alvo) alvo.style.overflow = antes ?? "";
      focoAnterior?.focus?.();
    };
  }, [aoFechar, irPara, scroller]);

  return (
    <div
      ref={caixaRef}
      role="dialog"
      aria-modal="true"
      aria-label={midia.alt}
      tabIndex={-1}
      onClick={aoFechar}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-breu/95 p-4 outline-none backdrop-blur-sm"
    >
      <Image
        src={midia.src}
        alt={midia.alt}
        width={midia.w}
        height={midia.h}
        sizes="100vw"
        className="max-h-[86svh] w-auto max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar"
        className="absolute right-5 top-5 border border-areia/30 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-areia hover:border-ambar hover:text-ambar"
      >
        Fechar
      </button>

      <Seta lado="esquerda" onClick={() => irPara(-1)} />
      <Seta lado="direita" onClick={() => irPara(1)} />

      <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center text-[10px] uppercase tracking-[0.3em] text-areia/50">
        {indice + 1} / {GALERIA.length}
      </p>
    </div>
  );
}

function Seta({ lado, onClick }: { lado: "esquerda" | "direita"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={lado === "esquerda" ? "Foto anterior" : "Próxima foto"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 -translate-y-1/2 border border-areia/25 px-3.5 py-3 text-areia/70 transition-colors hover:border-ambar hover:text-ambar ${
        lado === "esquerda" ? "left-4" : "right-4"
      }`}
    >
      {lado === "esquerda" ? "‹" : "›"}
    </button>
  );
}
