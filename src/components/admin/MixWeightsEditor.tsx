"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { PILLAR_LABELS } from "@/lib/content-constants";

const PILLARS = Object.keys(PILLAR_LABELS);

type History = { at: string; weights: Record<string, number>; motivo: string | null };

export function MixWeightsEditor({
  initialWeights,
  history,
}: {
  initialWeights: Record<string, number>;
  history: History[];
}) {
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    for (const p of PILLARS) w[p] = initialWeights[p] ?? 0;
    return w;
  });
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sum = PILLARS.reduce((acc, p) => acc + (weights[p] || 0), 0);
  const valido = Math.abs(sum - 100) <= 1 && PILLARS.every((p) => weights[p] >= 5 && weights[p] <= 35);

  async function salvar() {
    setBusy(true);
    setMsg(null);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ mix_weights: weights, motivo: motivo || null }),
      });
      setMsg("Mix atualizado.");
      setMotivo("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-areia/10 bg-breu/60 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div key={p}>
              <label className="flex items-center justify-between text-xs text-areia/60 mb-1">
                <span>{PILLAR_LABELS[p]}</span>
                <span className="text-dourado">{weights[p]}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={35}
                value={weights[p]}
                onChange={(e) => setWeights((w) => ({ ...w, [p]: Number(e.target.value) }))}
                className="w-full accent-ambar"
              />
            </div>
          ))}
        </div>
        <p className={`text-sm ${valido ? "text-areia/50" : "text-ambar"}`}>
          Soma atual: {sum}%. {valido ? "Dentro do permitido." : "Precisa fechar em 100%, cada pilar entre 5% e 35%."}
        </p>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo da mudança (opcional)"
          className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={salvar}
            disabled={!valido || busy}
            className="rounded-lg bg-ambar text-breu text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-40"
          >
            Salvar mix
          </button>
          {msg && <p className="text-sm text-areia/60">{msg}</p>}
        </div>
      </div>

      {history.length > 0 && (
        <details className="text-sm text-areia/60">
          <summary className="cursor-pointer text-areia/50">Histórico de mudanças ({history.length})</summary>
          <ul className="mt-2 space-y-2">
            {[...history].reverse().map((h, i) => (
              <li key={i} className="text-xs text-areia/50">
                {new Date(h.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                {h.motivo ? `, ${h.motivo}` : ""}: {PILLARS.map((p) => `${PILLAR_LABELS[p]} ${h.weights[p]}%`).join(", ")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
