"use client";

import { useState } from "react";
import { ReactLenis } from "lenis/react";

// No celular o scroll nativo já tem momentum próprio, e o smooth por cima disputa
// posição com ele e com o recolher da barra de endereço: a página pula ao inverter
// a direção. Então o smooth só entra onde tem ponteiro fino (mouse/trackpad) e o
// usuário não pediu menos movimento. Decidido já na primeira renderização, porque o
// Lenis lê as opções uma única vez, ao montar.
const scrollSuave = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [suave] = useState(scrollSuave);

  // O provider fica sempre montado: trocar a árvore remontaria o hero e o canvas.
  return (
    <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 1, smoothWheel: suave }}>
      {children}
    </ReactLenis>
  );
}
