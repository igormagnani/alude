"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";

const FRAME_COUNT = 87;
const src = (i: number) => `/hero/${String(i).padStart(3, "0")}.webp`;

/** Beats: [entra, sai] em progress 0..1, disjuntos. */
const BEATS = {
  logo: [0, 0.24] as const,
  anfitriao: [0.3, 0.58] as const,
  warmup: [0.64, 0.94] as const,
};

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

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const anfRef = useRef<HTMLDivElement>(null);
  const warmRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const targetFrame = useRef(0);
  const drawn = useRef(-1);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // preload progressivo: primeiro o frame 0, depois o resto
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
      for (let i = 1; i < FRAME_COUNT; i++) {
        const im = new window.Image();
        im.src = src(i);
        imgs[i] = im;
      }
    };
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // cover
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
      // se o frame exato ainda não carregou, usa o mais próximo já disponível
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
    targetFrame.current = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(p * (FRAME_COUNT - 1))));
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);

    if (logoRef.current) logoRef.current.style.opacity = String(beatOpacity(p, BEATS.logo, true));
    if (anfRef.current) anfRef.current.style.opacity = String(beatOpacity(p, BEATS.anfitriao));
    if (warmRef.current) warmRef.current.style.opacity = String(beatOpacity(p, BEATS.warmup));
  });

  useEffect(() => {
    const onResize = () => draw(drawn.current < 0 ? 0 : drawn.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (reduced) {
    return (
      <header className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <Image src="/brand/hero-poster.jpg" alt="Alude no palco" fill preload className="object-cover opacity-45" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/40 to-noite/70" />
        <div className="relative z-10 flex flex-col items-center gap-7">
          <Image src="/brand/logo-branca.png" alt="ALUDE" width={340} height={340} className="h-auto w-56" preload />
          <h1 className="display text-3xl md:text-5xl">O anfitrião da música boa no Rio</h1>
        </div>
      </header>
    );
  }

  const beatClass =
    "pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center";

  return (
    <div ref={ref} className="relative h-[400vh]">
      <h1 className="sr-only">
        Alude, o anfitrião da música boa no Rio. Do warmup ao after.
      </h1>
      <div className="sticky top-0 h-svh overflow-hidden bg-breu grain">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
        {!ready ? (
          <Image src="/brand/hero-poster.jpg" alt="" fill preload className="object-cover" sizes="100vw" />
        ) : null}

        {/* leitura */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,6,10,0.82)_92%)]" />

        <div ref={logoRef} style={{ opacity: 1 }} className={beatClass}>
          <Image
            src="/brand/logo-branca.png"
            alt="ALUDE"
            width={460}
            height={460}
            className="h-auto w-56 drop-shadow-[0_6px_34px_rgba(0,0,0,0.7)] md:w-80"
            preload
          />
        </div>

        <div ref={anfRef} style={{ opacity: 0 }} className={beatClass}>
          <p className="display max-w-5xl text-[clamp(2.2rem,7vw,6rem)]">
            O anfitrião da
            <br />
            música boa no Rio
          </p>
        </div>

        <div ref={warmRef} style={{ opacity: 0 }} className={beatClass}>
          <p className="display max-w-5xl text-[clamp(2.2rem,7vw,6rem)]">
            Do warmup
            <br />
            <span className="text-ambar">ao after</span>
          </p>
        </div>

        <p className="absolute inset-x-0 bottom-8 text-center text-[10px] uppercase tracking-[0.45em] text-areia/45">
          role
        </p>
      </div>
    </div>
  );
}
