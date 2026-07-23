"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";
import { LogoNeon } from "./LogoNeon";
import { useScroller } from "./Scroller";
import { useBeat } from "@/lib/audio-bus";

const FRAME_COUNT = 87;
const src = (i: number) => `/hero/${String(i).padStart(3, "0")}.webp`;

/**
 * Ato 1 do plano-sequência: a viewport vira palco e o scroll vira timeline.
 * Capítulos em progress 0..1, disjuntos. O scrub dos 87 frames é o cenário
 * do ato inteiro; logo, headlines em camadas e números acontecem DENTRO dele.
 */
const BEATS = {
  logo: [0, 0.26] as const,
  anfitriao: [0.3, 0.52] as const,
  warmup: [0.54, 0.7] as const,
};

const NUMEROS = [
  { n: 500, sufixo: "+", unit: "mil plays", label: "a primeira faixa, e contando" },
  { n: 1000, sufixo: "+", unit: "horas de palco", label: "do warmup ao after, noite após noite" },
  { n: 100, sufixo: "+", unit: "festas e clubes", label: "de casa cheia a réveillon" },
  { n: 6, sufixo: "", unit: "estados", label: "do Rio a Santa Catarina, sem contar o Chile" },
] as const;

// cada número tem seu próprio momento no palco, um de cada vez, como cartela de filme
const NUM_SPAN = 0.065;
const NUM_START = 0.72;
const numBeat = (i: number): readonly [number, number] => [
  NUM_START + i * NUM_SPAN,
  NUM_START + (i + 1) * NUM_SPAN,
];

// posições assimétricas: as cartelas passeiam pelo quadro em vez de empilhar no centro
const NUM_POS = [
  "left-[7vw] top-[18svh] text-left",
  "right-[7vw] top-[34svh] text-right",
  "left-[9vw] bottom-[22svh] text-left",
  "inset-x-0 top-[38svh] text-center",
] as const;

function beatOpacity(p: number, [a, b]: readonly [number, number], startVisible = false) {
  const span = b - a;
  const fadeIn = a + span * 0.22;
  const fadeOut = b - span * 0.26;
  if (startVisible) {
    if (p <= fadeOut) return 1;
    return Math.max(0, 1 - (p - fadeOut) / (b - fadeOut));
  }
  if (p <= a || p >= b) return 0;
  if (p < fadeIn) return (p - a) / (fadeIn - a);
  if (p > fadeOut) return 1 - (p - fadeOut) / (b - fadeOut);
  return 1;
}

/** 0..1 dentro do beat, com easeOut: dirige contagem e deslocamentos. */
function beatLocal(p: number, [a, b]: readonly [number, number]) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return 1 - (1 - t) * (1 - t);
}

const fmt = new Intl.NumberFormat("pt-BR");

// assina nada e nunca notifica: só serve pra distinguir servidor (false) de cliente (true)
const assinaNada = () => () => {};

export function AtoAbertura() {
  const ref = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const anfFrenteRef = useRef<HTMLDivElement>(null);
  const anfTrasRef = useRef<HTMLDivElement>(null);
  const warmFrenteRef = useRef<HTMLDivElement>(null);
  const warmTrasRef = useRef<HTMLDivElement>(null);
  const numRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numValRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const veuRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const targetFrame = useRef(0);
  const drawn = useRef(-1);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  // o servidor sempre renderiza o ato completo; o fallback só entra depois de montar,
  // senão o branch estrutural diverge do HTML do servidor e a hidratação estoura
  const montado = useSyncExternalStore(assinaNada, () => true, () => false);

  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end end"] });

  // O poster é o LCP; os 87 frames entram DEPOIS, em idle, pra não brigar com ele.
  useEffect(() => {
    if (reduced) return;
    let alive = true;
    const imgs: HTMLImageElement[] = [];
    const first = new window.Image();
    first.src = src(0);
    first.onload = () => {
      if (!alive) return;
      imgs[0] = first;
      imagesRef.current = imgs;
      setReady(true);
      draw(0);
      const carregarResto = () => {
        if (!alive) return;
        for (let i = 1; i < FRAME_COUNT; i++) {
          const im = new window.Image();
          im.src = src(i);
          imgs[i] = im;
        }
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(carregarResto, { timeout: 2500 });
      } else {
        window.setTimeout(carregarResto, 1);
      }
    };
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  function draw(index: number) {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    drawn.current = index;
  }

  function tick() {
    rafRef.current = 0;
    const target = targetFrame.current;
    if (target !== drawn.current) {
      let idx = target;
      if (!imagesRef.current[idx]?.complete) {
        for (let d = 1; d < FRAME_COUNT; d++) {
          if (imagesRef.current[target - d]?.complete) { idx = target - d; break; }
          if (imagesRef.current[target + d]?.complete) { idx = target + d; break; }
        }
      }
      draw(idx);
    }
  }

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // o scrub cobre o ato inteiro, mais lento que antes: cenário, não protagonista
    targetFrame.current = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(p * (FRAME_COUNT - 1))));
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);

    if (logoRef.current) logoRef.current.style.opacity = String(beatOpacity(p, BEATS.logo, true));

    // headlines em 2 camadas: a de trás anda mais rápido e maior = profundidade
    aplicarCamada(anfFrenteRef.current, anfTrasRef.current, p, BEATS.anfitriao);
    aplicarCamada(warmFrenteRef.current, warmTrasRef.current, p, BEATS.warmup);

    // cartelas de números: uma por vez, contagem dirigida pelo scroll.
    // A contagem fecha aos 55% do beat de propósito: o número final precisa
    // FICAR na tela um tempo antes da cartela sair, senão ninguém lê.
    for (let i = 0; i < NUMEROS.length; i++) {
      const el = numRefs.current[i];
      const val = numValRefs.current[i];
      if (!el) continue;
      const beat = numBeat(i);
      el.style.opacity = String(beatOpacity(p, beat));
      const contagem = beatLocal(p, [beat[0], beat[0] + (beat[1] - beat[0]) * 0.55]);
      el.style.transform = `translate3d(0, ${(1 - contagem) * 26}px, 0)`;
      if (val) val.textContent = fmt.format(Math.round(contagem * NUMEROS[i].n));
    }

    // decaimento: o palco entrega a página pro miolo sem corte seco
    // (curto de propósito: preto demais parece site quebrado, não cinema)
    if (veuRef.current) {
      const fim = Math.min(1, Math.max(0, (p - 0.978) / 0.022));
      veuRef.current.style.opacity = String(fim);
    }
  });

  function aplicarCamada(
    frente: HTMLDivElement | null,
    tras: HTMLDivElement | null,
    p: number,
    beat: readonly [number, number]
  ) {
    const o = beatOpacity(p, beat);
    const local = beatLocal(p, beat);
    if (frente) {
      frente.style.opacity = String(o);
      frente.style.transform = `translate3d(0, ${(1 - local) * 22 - 8}px, 0)`;
    }
    if (tras) {
      tras.style.opacity = String(o * 0.5);
      tras.style.transform = `translate3d(0, ${(1 - local) * 64 - 26}px, 0) scale(1.07)`;
    }
  }

  // pulso no beat: o palco respira junto da trilha; nada disso passa pelo React
  const aoBater = useCallback((v: number) => {
    if (glowRef.current) glowRef.current.style.opacity = String(0.1 + v * 0.3);
    if (canvasWrapRef.current) canvasWrapRef.current.style.transform = `scale(${1 + v * 0.009})`;
  }, []);
  useBeat(aoBater);

  useEffect(() => {
    const onResize = () => draw(drawn.current < 0 ? 0 : drawn.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (montado && reduced) {
    return (
      <header ref={(el) => { ref.current = el; }} className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <Image src="/brand/hero-poster.jpg" alt="Alude no palco" fill priority className="object-cover opacity-45" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/40 to-noite/70" />
        <div className="relative z-10 flex flex-col items-center gap-7">
          <LogoNeon className="w-64" />
          <h1 className="display text-3xl md:text-5xl">O anfitrião da boa música no Rio</h1>
        </div>
        <div className="relative z-10 mt-16 flex flex-col gap-10 text-left">
          <h2 className="sr-only">Alude em números</h2>
          {NUMEROS.map((it) => (
            <p key={it.label} className="display text-3xl text-areia">
              {fmt.format(it.n)}
              {it.sufixo}
              <span className="ml-3 text-ambar text-lg">{it.unit}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-areia/55">{it.label}</span>
            </p>
          ))}
        </div>
      </header>
    );
  }

  const cartela =
    "pointer-events-none absolute px-6 will-change-transform";
  const headlineFrente =
    "pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-transform";

  return (
    // 760svh: o ato inteiro (scrub + 3 capítulos de texto + 4 cartelas) num palco só
    <div ref={(el) => { ref.current = el; }} className="relative h-[760svh]">
      <h1 className="sr-only">Alude, o anfitrião da boa música no Rio. Do warmup ao after.</h1>
      <h2 className="sr-only">Alude em números</h2>
      <div ref={stickyRef} className="sticky top-0 h-svh overflow-hidden bg-breu grain">
        <div ref={canvasWrapRef} className="absolute inset-0 will-change-transform">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
          {!ready ? (
            <Image src="/brand/hero-poster.jpg" alt="" fill priority fetchPriority="high" className="object-cover" sizes="100vw" />
          ) : null}
        </div>

        {/* leitura: vinheta que concentra o olho no centro da cena */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,6,10,0.82)_92%)]" />

        {/* pulso: luz âmbar que respira com o grave da trilha */}
        <div
          ref={glowRef}
          aria-hidden
          className="absolute inset-0 opacity-10 mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse at 50% 78%, rgba(242,164,18,0.5) 0%, transparent 55%)",
          }}
        />

        <div ref={logoRef} style={{ opacity: 1 }} className={headlineFrente}>
          <LogoNeon className="w-[68vw] max-w-[520px] md:w-[42vw]" />
        </div>

        {/* capítulo: o anfitrião (camada de trás em contorno, camada da frente sólida) */}
        <div ref={anfTrasRef} style={{ opacity: 0 }} className={headlineFrente} aria-hidden>
          <p className="display outline-type max-w-5xl whitespace-nowrap text-[clamp(1.75rem,7.4vw,6rem)]">
            O anfitrião da
            <br />
            boa música no Rio
          </p>
        </div>
        <div ref={anfFrenteRef} style={{ opacity: 0 }} className={headlineFrente}>
          <p className="display max-w-5xl text-[clamp(1.75rem,7.4vw,6rem)]">
            O anfitrião da
            <br />
            boa música no Rio
          </p>
        </div>

        {/* capítulo: do warmup ao after */}
        <div ref={warmTrasRef} style={{ opacity: 0 }} className={headlineFrente} aria-hidden>
          <p className="display outline-type max-w-5xl whitespace-nowrap text-[clamp(1.75rem,7.4vw,6rem)]">
            Do warmup
            <br />
            ao after
          </p>
        </div>
        <div ref={warmFrenteRef} style={{ opacity: 0 }} className={headlineFrente}>
          <p className="display max-w-5xl text-[clamp(1.75rem,7.4vw,6rem)]">
            Do warmup
            <br />
            <span className="text-ambar">ao after</span>
          </p>
        </div>

        {/* capítulo: números, uma cartela por vez passeando pelo quadro */}
        {NUMEROS.map((it, i) => (
          <div key={it.label} ref={(el) => { numRefs.current[i] = el; }} style={{ opacity: 0 }} className={`${cartela} ${NUM_POS[i]}`}>
            <p className="display leading-none text-[clamp(3.4rem,12vw,10rem)] text-areia">
              <span ref={(el) => { numValRefs.current[i] = el; }}>0</span>
              {it.sufixo}
              <span className="ml-4 align-baseline text-ambar text-[clamp(1.2rem,2.8vw,2.4rem)] tracking-[0.01em] [word-spacing:0.18em]">
                {it.unit}
              </span>
            </p>
            <p className={`mt-3 max-w-md text-xs uppercase tracking-[0.22em] text-areia/55 md:text-sm ${i === 3 ? "mx-auto" : ""}`}>
              {it.label}
            </p>
          </div>
        ))}

        {/* costura: o palco escurece e solta a página */}
        <div ref={veuRef} aria-hidden style={{ opacity: 0 }} className="absolute inset-0 bg-noite" />
      </div>
    </div>
  );
}
