"use client";

import { useEffect, useRef, useState } from "react";
import { registerAudioEl } from "@/lib/audio-bus";
import { useScroller } from "./Scroller";

const KEY = "alude-som";
// Rolar não conta como gesto de ativação pro navegador, mas o toque que INICIA a
// rolagem conta. Por isso pointerdown/touchstart entram junto do scroll.
// mousedown/pointerup cobrem o primeiro clique em qualquer lugar; wheel não vale
// como ativação pro navegador, mas custa nada tentar onde valer (Firefox aceita)
const GESTOS = ["pointerdown", "pointerup", "mousedown", "touchstart", "touchend", "keydown", "click", "wheel"] as const;

export function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const scroller = useScroller();
  const [playing, setPlaying] = useState(false);
  const [quer, setQuer] = useState(true);

  // O estado do botão vem do elemento, não da nossa suposição: se o navegador aceitar o
  // play() e pausar logo depois (Brave e Safari fazem isso), o botão conta a verdade e o
  // gatilho volta a ficar armado sozinho.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const ligou = () => setPlaying(true);
    const parou = () => setPlaying(false);
    el.addEventListener("play", ligou);
    el.addEventListener("pause", parou);
    return () => {
      el.removeEventListener("play", ligou);
      el.removeEventListener("pause", parou);
    };
  }, []);

  useEffect(() => {
    setQuer(localStorage.getItem(KEY) !== "off");
  }, []);

  useEffect(() => {
    if (audioRef.current) registerAudioEl(audioRef.current);
  }, []);

  // Site de DJ: a trilha nasce ligada. Como o navegador bloqueia áudio antes de um gesto,
  // tentamos de cara e seguimos escutando ENQUANTO estiver pausado. Ficar escutando (em vez
  // de desarmar na primeira tentativa) é o que salva quando o navegador recusa o primeiro
  // gesto ou pausa por conta própria. Quem apertou "som off" continua no silêncio.
  useEffect(() => {
    const el = audioRef.current;
    if (!quer || !el) return;

    const tentar = () => {
      if (!el.paused) return;
      el.volume = 0.5;
      void el.play().catch(() => {});
    };

    tentar();
    const alvo = scroller.current;
    GESTOS.forEach((g) => window.addEventListener(g, tentar, { passive: true }));
    alvo?.addEventListener("scroll", tentar, { passive: true });
    return () => {
      GESTOS.forEach((g) => window.removeEventListener(g, tentar));
      alvo?.removeEventListener("scroll", tentar);
    };
  }, [quer, scroller]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setQuer(false);
      localStorage.setItem(KEY, "off");
      return;
    }
    setQuer(true);
    localStorage.setItem(KEY, "on");
    el.volume = 0.5;
    void el.play().catch(() => {});
  };

  const esperando = quer && !playing;

  return (
    <>
      <audio ref={audioRef} src="/audio/magnetic-loop.mp3" loop preload="auto" />
      <button
        ref={botaoRef}
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pausar a trilha do site" : "Tocar a trilha do site"}
        className={`fixed bottom-6 right-6 z-50 flex h-11 items-center gap-3 border px-4 backdrop-blur-[2px] transition-colors ${
          playing
            ? "border-ambar/70 bg-breu/85 text-ambar"
            : "border-areia/25 bg-breu/75 text-areia/75 hover:border-ambar/60 hover:text-ambar"
        } ${esperando ? "animate-pulse border-ambar/50 text-ambar/80" : ""}`}
      >
        <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-[3px] bg-current eq-bar ${playing ? "eq-on" : ""}`}
              style={{ animationDelay: `${i * 0.13}s` }}
            />
          ))}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.28em]">
          {playing ? "som on" : esperando ? "ligar o som" : "som off"}
        </span>
      </button>
    </>
  );
}
