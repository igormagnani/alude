"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * A página inteira rola DENTRO deste elemento, não no documento.
 *
 * Motivo: navegador de celular só recolhe a barra de endereços quando quem rola é o
 * documento. Com um contêiner próprio a barra fica parada, e some junto com ela a
 * animação que esticava o hero, a mudança de altura da viewport que fazia o scrub
 * pular frame e o reposicionamento da página ao inverter a direção da rolagem.
 * Preço: a barra do navegador nunca some, então o site vive com um pouco menos de tela.
 */
const ScrollerCtx = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

/** Passe pro `container` de todo useScroll. Sem isso o progresso mede o documento, que aqui não rola. */
export function useScroller() {
  const ref = useContext(ScrollerCtx);
  if (!ref) throw new Error("useScroller precisa estar dentro de <Scroller>");
  return ref;
}

const querSuave = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

export function Scroller({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [suave] = useState(querSuave);

  // Smooth scroll só em ponteiro fino: no celular ele disputa com o momentum nativo.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!suave || !wrapper || !content) return;

    const lenis = new Lenis({ wrapper, content, lerp: 0.09 });
    let frame = requestAnimationFrame(function loop(t: number) {
      lenis.raf(t);
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [suave]);

  // Com o documento travado, seta e Page Down não teriam alvo: quem rola precisa poder
  // receber foco. O anel de foco fica escondido porque cercar a tela inteira não diz
  // nada a ninguém; os links de dentro mantêm o foco visível deles.
  useEffect(() => {
    wrapperRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <ScrollerCtx.Provider value={wrapperRef}>
      <div
        ref={wrapperRef}
        tabIndex={0}
        className="h-svh w-full overflow-y-auto overflow-x-clip overscroll-none outline-none"
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </ScrollerCtx.Provider>
  );
}
