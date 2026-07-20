"use client";

import { useEffect, useRef, useState } from "react";

const ANCORAS = new Set(["Isso Não é Uma Festa", "D.Edge", "Privilège Búzios", "Privilège Juiz de Fora"]);

const FESTAS = [
  "Isso Não é Uma Festa", "Aldeia Lagoa", "Privilège Búzios", "Privilège Juiz de Fora",
  "C688", "Festa Tulum", "Pink Elephant", "D.Edge", "Tantra", "Sutton", "Selenza",
  "Haya Réveillon", "FeijoaJay", "AVA · Dash · Boox", "Holy Snow", "Casa Sounds",
  "Festival Love Park", "Baretto Londra", "Festa Boato", "Conexão RJxSP", "ARCVS",
  "JAM", "VEM!", "Jungle",
];

// [nome, x, y, sub, ancora do texto]
const CIDADES: [string, number, number, string, "start" | "end"][] = [
  ["Rio de Janeiro", 640, 250, "a casa", "start"],
  ["Búzios", 790, 168, "Privilège", "start"],
  ["Juiz de Fora", 560, 128, "Privilège", "end"],
  ["Vitória", 726, 62, "Pink Elephant · Tantra", "end"],
  ["São Paulo", 452, 312, "Sutton · Conexão RJxSP", "end"],
  ["Balneário Camboriú", 386, 402, "Selenza", "start"],
  ["Porto Alegre", 318, 474, "C688", "start"],
  ["Santiago · Chile", 96, 430, "Holy Snow", "start"],
];

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

function Constelacao() {
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setOn(true), io.disconnect()),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [, rx, ry] = ["", CIDADES[0][1], CIDADES[0][2]] as const;
  return (
    <svg
      ref={ref}
      viewBox="0 0 900 540"
      role="img"
      aria-label="Cidades onde o Alude já tocou, ligadas ao Rio de Janeiro"
      className="hidden w-full md:block"
    >
      {CIDADES.slice(1).map(([nome, x, y], i) => (
        <line
          key={nome}
          x1={rx}
          y1={ry}
          x2={x}
          y2={y}
          stroke="var(--areia)"
          strokeOpacity={0.2}
          strokeWidth={1}
          strokeDasharray="600"
          strokeDashoffset={on ? 0 : 600}
          style={{ transition: `stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 0.09}s` }}
        />
      ))}
      {CIDADES.map(([nome, x, y, sub, anchor], i) => {
        const hub = i === 0;
        const dx = anchor === "end" ? -14 : 14;
        return (
          <g key={nome} style={{ opacity: on ? 1 : 0, transition: `opacity 0.7s ease ${0.2 + i * 0.09}s` }}>
            {hub ? <circle cx={x} cy={y} r={15} fill="var(--ambar)" opacity={0.16} /> : null}
            <circle cx={x} cy={y} r={hub ? 6.5 : 4} fill="var(--ambar)">
              {!hub && (
                <animate attributeName="opacity" values="1;0.4;1" dur="3.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              )}
            </circle>
            <text x={x + dx} y={y + 1} textAnchor={anchor} fill="var(--areia)" fillOpacity={0.92} fontSize={hub ? 19 : 15} fontWeight={600}>
              {nome}
            </text>
            <text x={x + dx} y={y + 20} textAnchor={anchor} fill="var(--ambar)" fillOpacity={0.8} fontSize={11.5} letterSpacing="0.08em">
              {sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Mobile: a mesma rota, lida de cima pra baixo, com tudo legível. */
function RotaMobile() {
  const ref = useRef<HTMLUListElement>(null);
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
    <ul ref={ref} className="relative flex flex-col gap-7 pl-9 md:hidden">
      {/* trilha que se desenha */}
      <span
        aria-hidden
        className="absolute left-[7px] top-2 w-px origin-top bg-gradient-to-b from-ambar via-ambar/45 to-transparent transition-transform duration-[1400ms] ease-out"
        style={{ bottom: "0.75rem", transform: `scaleY(${on ? 1 : 0})` }}
      />
      {CIDADES.map(([nome, , , sub], i) => {
        const hub = i === 0;
        return (
          <li
            key={nome}
            className="relative transition-all duration-700 ease-out"
            style={{
              opacity: on ? 1 : 0,
              transform: on ? "none" : "translateX(-10px)",
              transitionDelay: `${0.12 + i * 0.09}s`,
            }}
          >
            <span
              aria-hidden
              className={`absolute -left-9 top-[0.45rem] rounded-full bg-ambar ${
                hub ? "h-3 w-3 ring-4 ring-ambar/20" : "h-2 w-2"
              }`}
              style={{ marginLeft: hub ? "-1px" : "0" }}
            />
            <p className={`leading-tight ${hub ? "text-lg font-semibold text-areia" : "text-base font-semibold text-areia/90"}`}>
              {nome}
            </p>
            <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-ambar/85">{sub}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function Festas() {
  const terco = Math.ceil(FESTAS.length / 2);
  return (
    <section className="bg-breu py-[14vh]">
      <div className="mx-auto mb-14 max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Onde esse som já tocou</p>
      </div>
      <Row items={FESTAS.slice(0, terco)} dir="left" />
      <Row items={[...FESTAS.slice(terco), "entre outras"]} dir="right" />
      <div className="mx-auto mt-[12vh] max-w-4xl px-6">
        <p className="mb-8 text-[11px] uppercase tracking-[0.4em] text-areia/40 md:hidden">
          A rota
        </p>
        <RotaMobile />
        <Constelacao />
      </div>
    </section>
  );
}
