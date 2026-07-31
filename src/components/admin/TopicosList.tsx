"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import {
  PILLAR_LABELS,
  TOPIC_SOURCE_LABELS,
  TOPIC_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_QUADRANTS,
  CONTENT_TYPE_TO_QUADRANT,
  CONTENT_TYPE_QUADRANT_BADGE,
} from "@/lib/content-constants";

type Topic = {
  id: string;
  source: string;
  title: string;
  angle: string | null;
  pillar: string | null;
  content_type: string | null;
  score: number;
  status: string;
};

const PILLAR_OPTIONS = Object.keys(PILLAR_LABELS);

function ContentTypeBadge({ contentType }: { contentType: string }) {
  const quadrant = CONTENT_TYPE_TO_QUADRANT[contentType];
  const classes = quadrant ? CONTENT_TYPE_QUADRANT_BADGE[quadrant] : "bg-areia/10 text-areia/70";
  return (
    <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${classes}`}>
      {CONTENT_TYPE_LABELS[contentType] ?? contentType}
    </span>
  );
}

export function TopicosList({ initialTopics }: { initialTopics: Topic[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [form, setForm] = useState({ title: "", angle: "", pillar: "", content_type: "", score: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const { topic } = await adminFetch("/api/admin/topics", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          angle: form.angle || null,
          pillar: form.pillar || null,
          content_type: form.content_type || null,
          score: form.score ? Number(form.score) : 0,
        }),
      });
      setTopics((prev) => [topic, ...prev]);
      setForm({ title: "", angle: "", pillar: "", content_type: "", score: "" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra criar o tópico.");
    } finally {
      setBusy(false);
    }
  }

  async function agir(id: string, action: "approve" | "discard") {
    try {
      await adminFetch(`/api/admin/topics/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
      setTopics((prev) =>
        action === "discard"
          ? prev.filter((t) => t.id !== id)
          : prev.map((t) => (t.id === id ? { ...t, status: "aprovado" } : t))
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu certo.");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={criar} className="rounded-xl border border-areia/10 bg-breu/60 p-5 space-y-3">
        <p className="text-sm text-areia/60">Novo tópico</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título"
            className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          />
          <input
            value={form.angle}
            onChange={(e) => setForm((f) => ({ ...f, angle: e.target.value }))}
            placeholder="Ângulo (opcional)"
            className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          />
          <select
            value={form.pillar}
            onChange={(e) => setForm((f) => ({ ...f, pillar: e.target.value }))}
            className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          >
            <option value="">Cenário (opcional)</option>
            {PILLAR_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {PILLAR_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={form.content_type}
            onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
            className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          >
            <option value="">Tipo (opcional)</option>
            {CONTENT_TYPE_QUADRANTS.map((q) => (
              <optgroup key={q.key} label={q.label}>
                {q.types.map((t) => (
                  <option key={t} value={t}>
                    {CONTENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            value={form.score}
            onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
            placeholder="Score (opcional)"
            type="number"
            className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          />
        </div>
        <button type="submit" disabled={busy || !form.title.trim()} className="rounded-lg bg-ambar text-breu text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-40">
          Adicionar
        </button>
      </form>

      {err && <p className="text-sm text-ambar/90">{err}</p>}

      {topics.length === 0 ? (
        <p className="text-sm text-areia/40 italic">Nenhum tópico na fila agora.</p>
      ) : (
        <div className="rounded-xl border border-areia/10 bg-breu/60 divide-y divide-areia/10">
          {topics.map((t) => (
            <div key={t.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] uppercase tracking-wide rounded-full bg-areia/10 text-areia/60 px-2 py-0.5">
                    {TOPIC_SOURCE_LABELS[t.source] ?? t.source}
                  </span>
                  {t.content_type && <ContentTypeBadge contentType={t.content_type} />}
                  {t.pillar && (
                    <span className="text-[10px] uppercase tracking-wide rounded-full bg-ambar/15 text-ambar px-2 py-0.5">
                      {PILLAR_LABELS[t.pillar]}
                    </span>
                  )}
                  {t.status !== "novo" && (
                    <span className="text-[10px] text-areia/40">{TOPIC_STATUS_LABELS[t.status]}</span>
                  )}
                </div>
                <p className="text-sm text-areia truncate">{t.title}</p>
                {t.angle && <p className="text-xs text-areia/50 truncate">{t.angle}</p>}
              </div>
              <p className="text-sm text-dourado w-12 text-right shrink-0">{t.score}</p>
              {t.status === "novo" && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => agir(t.id, "approve")} className="rounded-lg bg-ambar text-breu text-xs font-semibold px-3 py-1.5 hover:opacity-90">
                    Aprovar
                  </button>
                  <button onClick={() => agir(t.id, "discard")} className="rounded-lg border border-areia/20 text-xs text-areia/70 px-3 py-1.5 hover:border-areia/40">
                    Descartar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
