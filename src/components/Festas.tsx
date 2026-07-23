"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const ConstelacaoCeu = dynamic(() => import("./ConstelacaoCeu"), { ssr: false });

/** WebGL de verdade disponível? Sem ele (ou com reduced motion) fica o céu em SVG. */
function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const ANCORAS = new Set(["Isso Não é Uma Festa", "D.Edge", "Privilège Búzios", "Privilège Juiz de Fora"]);

const FESTAS = [
  "Isso Não é Uma Festa", "Aldeia Lagoa", "Privilège Búzios", "Privilège Juiz de Fora",
  "C688", "Festa Tulum", "Pink Elephant", "D.Edge", "Tantra", "Sutton", "Selenza",
  "Haya Réveillon", "FeijoaJay", "AVA · Dash · Boox", "Holy Snow", "Casa Sounds", "Passatempo",
  "Festival Love Park", "Baretto Londra", "Festa Boato", "Conexão RJxSP", "ARCVS",
  "JAM", "VEM!", "Jungle",
];

type Cidade = { nome: string; x: number; y: number; sub: string; anchor: "start" | "end" };

/** Paisagem: as cidades espalhadas, todas ligadas ao Rio. O índice 0 é sempre o hub. */
const DESKTOP: Cidade[] = [
  { nome: "Rio de Janeiro", x: 640, y: 250, sub: "a casa", anchor: "start" },
  { nome: "Búzios", x: 790, y: 168, sub: "Privilège", anchor: "start" },
  { nome: "Juiz de Fora", x: 560, y: 128, sub: "Privilège", anchor: "end" },
  { nome: "Vitória", x: 726, y: 62, sub: "Pink Elephant · Tantra", anchor: "end" },
  { nome: "São Paulo", x: 452, y: 312, sub: "Sutton · Conexão RJxSP", anchor: "end" },
  { nome: "Balneário Camboriú", x: 386, y: 402, sub: "Selenza", anchor: "start" },
  { nome: "Porto Alegre", x: 318, y: 474, sub: "C688", anchor: "start" },
  { nome: "Santiago · Chile", x: 96, y: 430, sub: "Holy Snow", anchor: "start" },
];
const DESKTOP_LINHAS: [number, number][] = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]];

/** Retrato: a mesma constelação redistribuída pra caber em pé, com tipo grande. */
const MOBILE: Cidade[] = [
  { nome: "Rio de Janeiro", x: 250, y: 300, sub: "a casa", anchor: "end" },
  { nome: "Búzios", x: 300, y: 190, sub: "Privilège", anchor: "start" },
  { nome: "Juiz de Fora", x: 95, y: 175, sub: "Privilège", anchor: "start" },
  { nome: "Vitória", x: 280, y: 85, sub: "Pink Elephant · Tantra", anchor: "end" },
  { nome: "São Paulo", x: 95, y: 420, sub: "Sutton · Conexão RJxSP", anchor: "start" },
  { nome: "Balneário Camboriú", x: 190, y: 530, sub: "Selenza", anchor: "start" },
  { nome: "Porto Alegre", x: 130, y: 630, sub: "C688", anchor: "start" },
  { nome: "Santiago · Chile", x: 55, y: 720, sub: "Holy Snow", anchor: "start" },
];
// em pé a descida vira corrente (SP desce pro sul), pra nenhuma linha atravessar a coluna
const MOBILE_LINHAS: [number, number][] = [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [5, 6], [6, 7]];

function Row({ items, dir }: { items: string[]; dir: "left" | "right" }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden py-2">
      <div
        aria-hidden="true"
        className={`marquee-track ${dir === "left" ? "marquee-left" : "marquee-right"}`}
      >
        {doubled.map((f, i) => (
          <span
            key={`${f}-${i}`}
            className={`display whitespace-nowrap px-6 text-[clamp(1.6rem,4.4vw,3.4rem)] ${
              ANCORAS.has(f) ? "text-areia" : "outline-type"
            }`}
          >
            {f}
            <span className="ml-6 text-ambar/70">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Constelacao({
  cidades,
  linhas,
  viewBox,
  fontes,
  className,
}: {
  cidades: Cidade[];
  linhas: [number, number][];
  viewBox: string;
  fontes: { hub: number; nome: number; sub: number; gap: number };
  className: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setOn(true), io.disconnect()),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      role="img"
      aria-label="Cidades onde o Alude já tocou, ligadas ao Rio de Janeiro"
      className={className}
    >
      {linhas.map(([a, b], i) => (
        <line
          key={`${a}-${b}`}
          x1={cidades[a].x}
          y1={cidades[a].y}
          x2={cidades[b].x}
          y2={cidades[b].y}
          stroke="var(--areia)"
          strokeOpacity={0.2}
          strokeWidth={1}
          strokeDasharray="600"
          strokeDashoffset={on ? 0 : 600}
          style={{ transition: `stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 0.09}s` }}
        />
      ))}
      {cidades.map(({ nome, x, y, sub, anchor }, i) => {
        const hub = i === 0;
        const dx = anchor === "end" ? -14 : 14;
        return (
          <g key={nome} style={{ opacity: on ? 1 : 0, transition: `opacity 0.7s ease ${0.2 + i * 0.09}s` }}>
            {hub ? <circle cx={x} cy={y} r={fontes.hub} fill="var(--ambar)" opacity={0.16} /> : null}
            <circle cx={x} cy={y} r={hub ? 6.5 : 4} fill="var(--ambar)">
              {!hub && (
                <animate attributeName="opacity" values="1;0.4;1" dur="3.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              )}
            </circle>
            {/* o contorno no breu abre um respiro atrás do texto: linha nenhuma atrapalha a leitura */}
            <text
              x={x + dx}
              y={y + 1}
              textAnchor={anchor}
              fill="var(--areia)"
              fillOpacity={0.92}
              fontSize={hub ? fontes.nome + 4 : fontes.nome}
              fontWeight={600}
              stroke="var(--breu)"
              strokeWidth={3.5}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {nome}
            </text>
            <text
              x={x + dx}
              y={y + fontes.gap}
              textAnchor={anchor}
              fill="var(--ambar)"
              fillOpacity={0.8}
              fontSize={fontes.sub}
              letterSpacing="0.08em"
              stroke="var(--breu)"
              strokeWidth={3}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Festas() {
  const terco = Math.ceil(FESTAS.length / 2);
  const reduced = useReducedMotion();
  const [ceu3d, setCeu3d] = useState(false);
  useEffect(() => {
    setCeu3d(!reduced && temWebGL());
  }, [reduced]);

  return (
    // pt só: com o céu 3D no fim, padding embaixo viraria uma faixa de breu entre o amanhecer e o Booking
    <section className="bg-breu pt-[14vh]">
      <div className="mx-auto mb-14 max-w-6xl px-6">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-ambar">Onde esse som já tocou</h2>
      </div>
      <Row items={FESTAS.slice(0, terco)} dir="left" />
      <Row items={FESTAS.slice(terco)} dir="right" />
      {ceu3d ? (
        <div className="mt-[10vh]">
          <ConstelacaoCeu />
        </div>
      ) : (
        <div className="mx-auto mt-[12vh] max-w-4xl px-6 pb-[14vh]">
          <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-areia/40 md:hidden">A rota</p>
          <Constelacao
            cidades={MOBILE}
            linhas={MOBILE_LINHAS}
            viewBox="0 0 400 780"
            fontes={{ hub: 17, nome: 17.5, sub: 12, gap: 22 }}
            className="w-full md:hidden"
          />
          <Constelacao
            cidades={DESKTOP}
            linhas={DESKTOP_LINHAS}
            viewBox="0 0 900 540"
            fontes={{ hub: 15, nome: 15, sub: 11.5, gap: 20 }}
            className="hidden w-full md:block"
          />
        </div>
      )}
    </section>
  );
}
