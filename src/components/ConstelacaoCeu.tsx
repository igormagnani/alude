"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useScroller } from "./Scroller";
import { useBeat } from "@/lib/audio-bus";

/**
 * Ato final: as cidades onde o Alude tocou viram um céu que a câmera atravessa.
 * O scroll é a viagem: cada cidade acende quando a câmera chega perto, todas
 * ligadas ao Rio, que é a última parada. No fim o céu amanhece pro Booking.
 */

export type CidadeCeu = { nome: string; sub: string; x: number; y: number };

const CIDADES: CidadeCeu[] = [
  { nome: "Búzios", sub: "Privilège", x: 790, y: 168 },
  { nome: "Juiz de Fora", sub: "Privilège", x: 560, y: 128 },
  { nome: "Vitória", sub: "Pink Elephant · Tantra", x: 726, y: 62 },
  { nome: "São Paulo", sub: "Sutton · Conexão RJxSP", x: 452, y: 312 },
  { nome: "Balneário Camboriú", sub: "Selenza", x: 386, y: 402 },
  { nome: "Porto Alegre", sub: "C688", x: 318, y: 474 },
  { nome: "Santiago · Chile", sub: "Holy Snow", x: 96, y: 430 },
  { nome: "Rio de Janeiro", sub: "a casa", x: 640, y: 250 },
];

const PASSO = 3.1; // distância em z entre cidades
const RIO = CIDADES.length - 1;

/** posição 3D de cada cidade: o 2D da constelação vira profundidade de viagem */
function posicao(i: number, retrato: boolean): [number, number, number] {
  const c = CIDADES[i];
  const esc = retrato ? 150 : 130;
  const lx = retrato ? ((c.x - 450) / esc) * 0.55 : (c.x - 450) / esc;
  const ly = (250 - c.y) / esc;
  return [lx, ly, -(i + 1) * PASSO];
}

// gerador determinístico: o céu é o mesmo em toda visita
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Estrelas({ beatRef }: { beatRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const rand = mulberry32(7);
    const n = 420;
    const pos = new Float32Array(n * 3);
    const profundidade = (CIDADES.length + 3) * PASSO;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 26;
      pos[i * 3 + 1] = (rand() - 0.5) * 15;
      pos[i * 3 + 2] = -rand() * profundidade - 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color("#f0e6d7"),
      size: 0.075,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });
    return { geo, mat };
  }, []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(() => {
    // as estrelas de fundo respiram com o grave da trilha
    mat.size = 0.075 + beatRef.current * 0.025;
  });
  return <points ref={ref} geometry={geo} material={mat} />;
}

function Cidade({
  indice,
  retrato,
  litRef,
}: {
  indice: number;
  retrato: boolean;
  litRef: React.MutableRefObject<number[]>;
}) {
  const grupo = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const nucleo = useRef<THREE.Mesh>(null);
  const html = useRef<HTMLDivElement>(null);
  const hub = indice === RIO;
  const pos = useMemo(() => posicao(indice, retrato), [indice, retrato]);
  // em pé, cidade do lado direito do quadro tem o rótulo virado pra dentro (senão corta na borda)
  const virado = retrato && CIDADES[indice].x > 550;

  useFrame(() => {
    const lit = litRef.current[indice] ?? 0;
    if (halo.current) {
      (halo.current.material as THREE.MeshBasicMaterial).opacity = lit * (hub ? 0.34 : 0.22);
      halo.current.scale.setScalar(0.6 + lit * (hub ? 1.6 : 1));
    }
    if (nucleo.current) {
      (nucleo.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + lit * 0.85;
    }
    if (html.current) {
      html.current.style.opacity = String(lit);
      html.current.style.transform = `translateY(${(1 - lit) * 14}px)`;
    }
  });

  return (
    <group ref={grupo} position={pos}>
      <mesh ref={halo}>
        <sphereGeometry args={[hub ? 0.34 : 0.22, 16, 16]} />
        <meshBasicMaterial color="#f2a412" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={nucleo}>
        <sphereGeometry args={[hub ? 0.085 : 0.055, 16, 16]} />
        <meshBasicMaterial color="#f2a412" transparent opacity={0.15} />
      </mesh>
      <Html position={[virado ? -0.28 : 0.28, 0.05, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        {/* o flip fica num wrapper estático: o filho anima transform por frame e sobrescreveria */}
        <div style={virado ? { transform: "translateX(-100%)", textAlign: "right" as const } : undefined}>
          <div ref={html} style={{ opacity: 0, transition: "opacity .2s linear", whiteSpace: "nowrap" }}>
            <p className={`display ${hub ? "text-2xl md:text-4xl" : "text-lg md:text-2xl"} text-areia`}>{CIDADES[indice].nome}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-ambar/85">{CIDADES[indice].sub}</p>
          </div>
        </div>
      </Html>
    </group>
  );
}

function Linhas({ retrato, litRef }: { retrato: boolean; litRef: React.MutableRefObject<number[]> }) {
  const mats = useRef<THREE.LineBasicMaterial[]>([]);
  const linhas = useMemo(() => {
    const rio = posicao(RIO, retrato);
    return CIDADES.slice(0, RIO).map((_, i) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...posicao(i, retrato)),
        new THREE.Vector3(...rio),
      ]);
      return geo;
    });
  }, [retrato]);
  useEffect(() => () => linhas.forEach((g) => g.dispose()), [linhas]);
  useFrame(() => {
    mats.current.forEach((m, i) => {
      if (m) m.opacity = Math.min(litRef.current[i] ?? 0, litRef.current[RIO] ?? 0) * 0.4;
    });
  });
  return (
    <>
      {linhas.map((geo, i) => (
        <primitive
          key={i}
          object={new THREE.Line(
            geo,
            (mats.current[i] ??= new THREE.LineBasicMaterial({
              color: new THREE.Color("#f0e6d7"),
              transparent: true,
              opacity: 0,
            }))
          )}
        />
      ))}
    </>
  );
}

function Cena({
  progressRef,
  beatRef,
  retrato,
}: {
  progressRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  retrato: boolean;
}) {
  const litRef = useRef<number[]>(CIDADES.map(() => 0));

  useFrame(({ camera }) => {
    const p = progressRef.current;
    // a viagem: da boca do céu até depois do Rio
    const zInicio = 2;
    const zFim = -(CIDADES.length + 1.6) * PASSO;
    const z = zInicio + (zFim - zInicio) * p;
    camera.position.set(Math.sin(p * Math.PI * 2) * 0.5, Math.cos(p * Math.PI * 1.5) * 0.3, z);
    camera.lookAt(0, 0, z - 6);

    // cada cidade acende quando a câmera se aproxima do plano dela
    for (let i = 0; i < CIDADES.length; i++) {
      const czRaw = -(i + 1) * PASSO;
      const dist = czRaw - z; // negativo = à frente da câmera
      const alvo = dist < 1.5 && dist > -PASSO * 2.8 ? 1 : dist > -PASSO * 4 ? 0.45 : 0;
      const atual = litRef.current[i];
      litRef.current[i] = atual + (alvo - atual) * 0.08;
    }
  });

  return (
    <>
      <Estrelas beatRef={beatRef} />
      <Linhas retrato={retrato} litRef={litRef} />
      {CIDADES.map((_, i) => (
        <Cidade key={i} indice={i} retrato={retrato} litRef={litRef} />
      ))}
    </>
  );
}

export default function ConstelacaoCeu() {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const beatRef = useRef(0);
  const auroraRef = useRef<HTMLDivElement>(null);
  const [ligado, setLigado] = useState(false);
  const [retrato, setRetrato] = useState(false);
  const scroller = useScroller();
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    progressRef.current = p;
    if (auroraRef.current) {
      // amanhece: o céu entrega a página pro Booking claro
      auroraRef.current.style.opacity = String(Math.min(1, Math.max(0, (p - 0.86) / 0.14)));
    }
  });

  useBeat((v) => { beatRef.current = v; });

  // o canvas só existe com a seção por perto (bateria e memória agradecem)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLigado(e.isIntersecting), { rootMargin: "60% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setRetrato(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div ref={ref} className="relative h-[380svh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-breu">
        {ligado ? (
          <Canvas dpr={[1, 2]} camera={{ fov: 58, near: 0.1, far: 80 }} className="absolute inset-0">
            <Cena progressRef={progressRef} beatRef={beatRef} retrato={retrato} />
          </Canvas>
        ) : null}
        {/* vinheta pra costurar com o resto do site */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,6,10,0.6)_100%)]" />
        {/* o amanhecer: crossfade do breu pra areia na entrada do Booking */}
        <div
          ref={auroraRef}
          aria-hidden
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#f0e6d7_0%,rgba(240,230,215,0.9)_40%,rgba(240,230,215,0.35)_70%,transparent_100%)]"
        />
      </div>
    </div>
  );
}
