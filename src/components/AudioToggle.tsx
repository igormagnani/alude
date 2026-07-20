"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "alude-som";

export function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    setHint(localStorage.getItem(KEY) === "on");
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      localStorage.setItem(KEY, "off");
      return;
    }
    el.volume = 0.5;
    void el
      .play()
      .then(() => {
        setPlaying(true);
        setHint(false);
        localStorage.setItem(KEY, "on");
      })
      .catch(() => {});
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/magnetic-loop.mp3" loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pausar a trilha do site" : "Tocar a trilha do site"}
        className={`fixed bottom-6 right-6 z-50 flex h-11 items-center gap-3 border px-4 backdrop-blur-[2px] transition-colors ${
          playing
            ? "border-ambar/70 bg-breu/85 text-ambar"
            : "border-areia/25 bg-breu/75 text-areia/75 hover:border-ambar/60 hover:text-ambar"
        } ${hint && !playing ? "animate-pulse" : ""}`}
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
