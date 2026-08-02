"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_QUADRANTS } from "@/lib/content-constants";

const CONTENT_TYPES = CONTENT_TYPE_QUADRANTS.flatMap((q) => q.types);
const FLOOR = 5;
const CEIL = 30;

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
    for (const t of CONTENT_TYPES) w[t] = initialWeights[t] ?? 0;
    return w;
  });
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sum = CONTENT_TYPES.reduce((acc, t) => acc + (weights[t] || 0), 0);
  const foraDoPiso = CONTENT_TYPES.filter((t) => weights[t] < FLOOR || weights[t] > CEIL);
  const valido = Math.abs(sum - 100) <= 1 && foraDoPiso.length === 0;

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
      <div className="rounded-xl border border-areia/10 bg-breu/60 p-5 space-y-6">
        {CONTENT_TYPE_QUADRANTS.map((q) => {
          const subtotal = q.types.reduce((acc, t) => acc + (weights[t] || 0), 0);
          return (
            <div key={q.key}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-wide text-areia/50">{q.label}</h3>
                <span className="text-xs text-dourado">{subtotal}% do quadrante</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {q.types.map((t) => (
                  <div key={t}>
                    <label className="flex items-center justify-between text-xs text-areia/60 mb-1">
                      <span>{CONTENT_TYPE_LABELS[t]}</span>
                      <span className="text-dourado">{weights[t]}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights[t]}
                      onChange={(e) => setWeights((w) => ({ ...w, [t]: Number(e.target.value) }))}
                      className="w-full accent-ambar"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <p className={`text-sm ${valido ? "text-areia/50" : "text-brasa"}`}>
          Soma atual: {sum}%.{" "}
          {valido
            ? "Dentro do permitido."
            : foraDoPiso.length > 0
              ? `Precisa ficar entre ${FLOOR}% e ${CEIL}% em cada tipo (fora do intervalo: ${foraDoPiso.map((t) => CONTENT_TYPE_LABELS[t]).join(", ")}).`
              : "Precisa fechar em 100% no total."}
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
                {h.motivo ? `, ${h.motivo}` : ""}:{" "}
                {CONTENT_TYPES.map((t) => `${CONTENT_TYPE_LABELS[t]} ${h.weights[t] ?? 0}%`).join(", ")}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
