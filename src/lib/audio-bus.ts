"use client";

import { useEffect } from "react";

/**
 * Liga o <audio> do site a um AnalyserNode e distribui um nível de grave (0..1)
 * pra quem quiser pulsar junto. createMediaElementSource só pode existir UMA vez
 * por elemento, então o grafo é singleton e fica: source → analyser → destination
 * (sem o destination no fim, o site emudece).
 */

let audioEl: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let raf = 0;
let level = 0;

const subs = new Set<(v: number) => void>();

export function registerAudioEl(el: HTMLAudioElement) {
  audioEl = el;
  // O AudioContext nasce suspenso sem gesto; o play (que já exige gesto) destrava.
  el.addEventListener("play", () => {
    ensureGraph();
    void ctx?.resume();
    startLoop();
  });
  el.addEventListener("pause", stopLoopSoon);
}

function ensureGraph() {
  if (!audioEl || ctx) return;
  try {
    ctx = new AudioContext();
    const src = ctx.createMediaElementSource(audioEl);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    bins = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    analyser.connect(ctx.destination);
  } catch {
    // navegador sem Web Audio: o site segue sem pulso
    ctx = null;
    analyser = null;
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
  if (!raf && subs.size > 0) raf = requestAnimationFrame(tick);
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
