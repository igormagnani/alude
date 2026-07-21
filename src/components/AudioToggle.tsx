"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useScroller } from "./Scroller";

const KEY = "alude-som";
// rolar não conta como gesto de ativação pro navegador, mas o toque que inicia a
// rolagem conta: por isso pointerdown/touchstart entram junto do scroll
const GESTOS = ["pointerdown", "touchstart", "touchend", "keydown", "click"] as const;

export function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [armado, setArmado] = useState(false);
  const scroller = useScroller();

  const iniciar = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return false;
    el.volume = 0.5;
    try {
      await el.play();
      setPlaying(true);
      setArmado(false);
      localStorage.setItem(KEY, "on");
      return true;
    } catch {
      return false;
    }
  }, []);

  // Site de DJ: a trilha nasce ligada. Só que todo navegador bloqueia áudio antes de um
  // gesto do usuário, então tentamos tocar de cara e, se o bloqueio vier, deixamos armado
  // pro primeiro toque em qualquer lugar da página. Quem já desligou uma vez (localStorage
  // "off") continua no silêncio: preferência explícita ganha do padrão.
  useEffect(() => {
    if (localStorage.getItem(KEY) === "off") return;

    let vivo = true;
    let desarmar = () => {};

    void (async () => {
      if (await iniciar()) return;
      if (!vivo) return;
      setArmado(true);

      const aoGesto = async (e: Event) => {
        // toque no próprio botão é decisão dele: deixa o onClick resolver
        if (e.target instanceof Node && botaoRef.current?.contains(e.target)) return;
        // só desarma se realmente tocou: gesto que o navegador não aceitou como
        // válido não pode custar a próxima chance
        if (await iniciar()) desarmar();
      };
      const alvoScroll = scroller.current;
      desarmar = () => {
        GESTOS.forEach((g) => window.removeEventListener(g, aoGesto));
        alvoScroll?.removeEventListener("scroll", aoGesto);
      };
      GESTOS.forEach((g) => window.addEventListener(g, aoGesto));
      alvoScroll?.addEventListener("scroll", aoGesto);
    })();

    return () => {
      vivo = false;
      desarmar();
    };
  }, [iniciar, scroller]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      setArmado(false);
      localStorage.setItem(KEY, "off");
      return;
    }
    void iniciar();
  };

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
        } ${armado ? "animate-pulse border-ambar/50 text-ambar/80" : ""}`}
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
          {playing ? "som on" : "som off"}
        </span>
      </button>
    </>
  );
}
