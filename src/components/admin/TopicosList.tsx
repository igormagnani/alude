"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Badge, Button, Card, EmptyState, Input, Select, type BadgeTone } from "@/components/admin/ui";

type Topic = {
  id: string;
  source: string;
  title: string;
  angle: string | null;
  pillar: string | null;
  content_type: string | null;
  score: number;
  status: string;
  used_item_id?: string | null;
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

function statusTone(status: string): BadgeTone {
  if (status === "usado") return "dourado";
  if (status === "aprovado") return "ambar";
  return "neutral";
}

/**
 * Pauta: triagem de tópicos em cards (primitivas `ui.tsx`). Um tópico já
 * `usado` não tem mais ação de aprovar/descartar, só o link pra peça que
 * nasceu dele — `usedItemsById` vem da segunda query manual da page (Pauta
 * não confia em FK pra isso, `used_item_id` não tem). A criação fica atrás de
 * um disclosure: a pauta é sobretudo triagem, não cadastro.
 */
export function TopicosList({
  initialTopics,
  usedItemsById,
}: {
  initialTopics: Topic[];
  usedItemsById: Record<string, { id: string; title: string }>;
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [formOpen, setFormOpen] = useState(false);
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
      setFormOpen(false);
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
      <div>
        {formOpen ? (
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-areia/60">Novo tópico</p>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-xs text-areia/40 transition-colors duration-150 hover:text-areia"
              >
                cancelar
              </button>
            </div>
            <form onSubmit={criar} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Título"
                  autoFocus
                />
                <Input
                  value={form.angle}
                  onChange={(e) => setForm((f) => ({ ...f, angle: e.target.value }))}
                  placeholder="Ângulo (opcional)"
                />
                <Select value={form.pillar} onChange={(e) => setForm((f) => ({ ...f, pillar: e.target.value }))}>
                  <option value="">Cenário (opcional)</option>
                  {PILLAR_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PILLAR_LABELS[p]}
                    </option>
                  ))}
                </Select>
                <Select
                  value={form.content_type}
                  onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
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
                </Select>
                <Input
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                  placeholder="Score (opcional)"
                  type="number"
                />
              </div>
              <Button type="submit" variant="primary" disabled={busy || !form.title.trim()}>
                {busy ? "Adicionando…" : "Adicionar"}
              </Button>
            </form>
          </Card>
        ) : (
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            + Novo tópico
          </Button>
        )}
      </div>

      {err && <p className="text-sm text-brasa">{err}</p>}

      {topics.length === 0 ? (
        <EmptyState title="Pauta limpa" description="Nenhum tópico esperando triagem agora." />
      ) : (
        <div className="space-y-2">
          {topics.map((t) => {
            const usedItem = t.used_item_id ? usedItemsById[t.used_item_id] : null;
            return (
              <Card key={t.id} padding="sm">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="neutral">{TOPIC_SOURCE_LABELS[t.source] ?? t.source}</Badge>
                      {t.content_type && <ContentTypeBadge contentType={t.content_type} />}
                      {t.pillar && <Badge tone="ambar">{PILLAR_LABELS[t.pillar]}</Badge>}
                      {t.status !== "novo" && <Badge tone={statusTone(t.status)}>{TOPIC_STATUS_LABELS[t.status]}</Badge>}
                    </div>
                    <p className="truncate text-sm text-areia">{t.title}</p>
                    {t.angle && <p className="truncate text-xs text-areia/50">{t.angle}</p>}
                    {t.status === "usado" && usedItem && (
                      <Link
                        href={`/admin/p/${usedItem.id}`}
                        className="mt-1 inline-block text-xs text-dourado transition-colors duration-150 hover:text-ambar"
                      >
                        ver peça →
                      </Link>
                    )}
                  </div>
                  <p className="w-10 shrink-0 text-right text-sm text-dourado">{t.score}</p>
                  {t.status === "novo" && (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="primary" onClick={() => agir(t.id, "approve")}>
                        Aprovar
                      </Button>
                      <Button variant="secondary" onClick={() => agir(t.id, "discard")}>
                        Descartar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
