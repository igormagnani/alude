"use client";

import { useEffect } from "react";

/**
 * Distribui um nível de grave (0..1) da trilha pra quem quiser pulsar junto.
 *
 * LIÇÃO APRENDIDA (da pior forma, em produção): rotear o <audio> por
 * createMediaElementSource sequestra a saída do elemento pro AudioContext, e
 * qualquer contexto que não rode de verdade (iOS no silencioso, Brave com
 * proteções, resume pendente) deixa o site MUDO com o botão dizendo "som on".
 *
 * Então aqui NINGUÉM toca na saída de áudio: o MP3 é baixado (cache do próprio
 * player), decodificado num OfflineAudioContext (que não tem saída nenhuma) e
 * vira um envelope de energia grave pré-computado. Em playback, o pulso é só
 * uma leitura de array indexada por el.currentTime. Som e efeito ficam 100%
 * independentes, em toda plataforma.
 */

const JANELA = 0.05; // segundos por amostra do envelope
const TAXA = 16000; // decodificar reamostrado: memória e CPU mínimas

let audioEl: HTMLAudioElement | null = null;
let envelope: Float32Array | null = null;
let dur = 0;
let carregando = false;
let raf = 0;
let level = 0;

const subs = new Set<(v: number) => void>();

export function registerAudioEl(el: HTMLAudioElement) {
  audioEl = el;
  el.addEventListener("play", () => {
    void prepararEnvelope();
    startLoop();
  });
  el.addEventListener("pause", stopLoopSoon);
  // prepara em idle mesmo antes do play: o pulso já nasce pronto
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => void prepararEnvelope(), { timeout: 6000 });
  } else {
    window.setTimeout(() => void prepararEnvelope(), 2500);
  }
}

async function prepararEnvelope() {
  if (envelope || carregando || !audioEl) return;
  carregando = true;
  try {
    const src = audioEl.currentSrc || audioEl.src;
    const buf = await (await fetch(src)).arrayBuffer();
    // OfflineAudioContext: decodifica e reamostra sem existir saída de áudio
    const off = new OfflineAudioContext(1, 1, TAXA);
    const audio = await off.decodeAudioData(buf);
    const ch = audio.getChannelData(0);
    const porJanela = Math.round(audio.sampleRate * JANELA);
    const n = Math.ceil(ch.length / porJanela);
    const env = new Float32Array(n);
    // passa-baixa simples antes do RMS: o kick é quem comanda o pulso
    let lp = 0;
    const alpha = 0.08;
    for (let j = 0; j < n; j++) {
      let soma = 0;
      const ini = j * porJanela;
      const fim = Math.min(ch.length, ini + porJanela);
      for (let i = ini; i < fim; i++) {
        lp += alpha * (ch[i] - lp);
        soma += lp * lp;
      }
      env[j] = Math.sqrt(soma / Math.max(1, fim - ini));
    }
    let pico = 0;
    for (let j = 0; j < n; j++) pico = Math.max(pico, env[j]);
    if (pico > 0) for (let j = 0; j < n; j++) env[j] /= pico;
    envelope = env;
    dur = audio.duration;
    startLoop();
  } catch {
    // sem envelope o site segue normal, só não pulsa
  } finally {
    carregando = false;
  }
}

function tick() {
  raf = 0;
  if (!envelope || !audioEl || audioEl.paused || subs.size === 0 || dur === 0) return;
  const t = audioEl.currentTime % dur;
  const bruto = envelope[Math.min(envelope.length - 1, Math.floor(t / JANELA))] ?? 0;
  // suavização assimétrica: sobe rápido no ataque, desce devagar
  level = bruto > level ? level * 0.55 + bruto * 0.45 : level * 0.88 + bruto * 0.12;
  subs.forEach((cb) => cb(level));
  raf = requestAnimationFrame(tick);
}

function startLoop() {
  if (!raf && subs.size > 0 && envelope) raf = requestAnimationFrame(tick);
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
