"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * A logo como o letreiro de LED do palco: acende com flicker de neon,
 * respira em glow âmbar e inclina levemente com o mouse (paralaxe 3D).
 */
export function LogoNeon({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = tiltRef.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      raf = 0;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.transform = `rotateY(${cx * 9}deg) rotateX(${-cy * 7}deg) translateZ(0)`;
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} className={`[perspective:900px] ${className}`}>
      <div ref={tiltRef} className="will-change-transform [transform-style:preserve-3d]">
        <div className={reduced ? "" : "logo-ignite"}>
          <Image
            src="/brand/logo-cor.png"
            alt="ALUDE"
            width={1200}
            height={590}
            className="logo-glow h-auto w-full"
            priority
          />
        </div>
      </div>
    </div>
  );
}
