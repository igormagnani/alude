"use client";

import { useEffect } from "react";

/**
 * Liga o <audio> do site a um AnalyserNode e distribui um nível de grave (0..1)
 * pra quem quiser pulsar junto.
 *
 * REGRA DE OURO: o som vem antes do pulso. createMediaElementSource sequestra a
 * saída do elemento pra dentro do AudioContext, e se o contexto não estiver
 * rodando de verdade o site fica MUDO com o botão dizendo "som on" (aconteceu
 * no iPhone). Então:
 *  - iOS: nunca cria o grafo (a chavinha de silencioso do aparelho silencia
 *    WebAudio; áudio direto do elemento é o único caminho confiável). O hero
 *    simplesmente não pulsa lá.
 *  - Resto: só roteia DEPOIS do AudioContext confirmar state === "running".
 */

let audioEl: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let tentandoGraph = false;
let raf = 0;
let level = 0;

const subs = new Set<(v: number) => void>();

function ehIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function registerAudioEl(el: HTMLAudioElement) {
  audioEl = el;
  el.addEventListener("play", () => {
    ensureGraph();
    void ctx?.resume();
    startLoop();
  });
  el.addEventListener("pause", stopLoopSoon);
}

function ensureGraph() {
  if (!audioEl || ctx || tentandoGraph || ehIOS()) return;
  tentandoGraph = true;
  try {
    const c = new AudioContext();
    c.resume()
      .then(() => {
        if (c.state !== "running" || ctx || !audioEl) {
          // sem contexto rodando não se sequestra saída de áudio de ninguém
          void c.close();
          tentandoGraph = false;
          return;
        }
        try {
          const src = c.createMediaElementSource(audioEl);
          const a = c.createAnalyser();
          a.fftSize = 256;
          a.smoothingTimeConstant = 0.6;
          src.connect(a);
          a.connect(c.destination);
          ctx = c;
          analyser = a;
          bins = new Uint8Array(a.frequencyBinCount);
          startLoop();
        } catch {
          void c.close();
        }
      })
      .catch(() => {
        void c.close();
        tentandoGraph = false;
      });
  } catch {
    tentandoGraph = false;
  }
}

function tick() {
  raf = 0;
  if (!analyser || !bins || !audioEl || audioEl.paused || subs.size === 0) return;
  analyser.getByteFrequencyData(bins);
  // média dos bins graves (kick vive embaixo do espectro)
  let soma = 0;
  const n = 9;
  for (let i = 0; i < n; i++) soma += bins[i];
  const bruto = soma / n / 255;
  // suavização assimétrica: sobe rápido no ataque, desce devagar
  level = bruto > level ? level * 0.55 + bruto * 0.45 : level * 0.88 + bruto * 0.12;
  subs.forEach((cb) => cb(level));
  raf = requestAnimationFrame(tick);
}

function startLoop() {
  if (!raf && subs.size > 0 && analyser) raf = requestAnimationFrame(tick);
}

function stopLoopSoon() {
  // deixa o nível decair até perto de zero antes de parar, pra não congelar um glow aceso
  const decair = () => {
    raf = 0;
    if (!audioEl || (!audioEl.paused && subs.size > 0)) return startLoop();
    level *= 0.9;
    subs.forEach((cb) => cb(level));
    if (level > 0.01) raf = requestAnimationFrame(decair);
    else subs.forEach((cb) => cb(0));
  };
  if (!raf) raf = requestAnimationFrame(decair);
}

/** Chama `cb` a cada frame com o nível de grave 0..1 enquanto a trilha toca. */
export function useBeat(cb: (v: number) => void) {
  useEffect(() => {
    subs.add(cb);
    startLoop();
    return () => {
      subs.delete(cb);
      if (subs.size === 0 && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
  }, [cb]);
}
