"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import {
  PILLAR_LABELS,
  FORMAT_LABELS,
  PLATFORM_LABELS,
  ITEM_STATUS_LABELS,
  formatScheduledAt,
  isScheduledLate,
} from "@/lib/content-constants";
import { ContentTypeBadge } from "@/components/admin/FilaList";
import { ASSET_PROMPT_TOOLS, type AssetPrompt, type ContentAsset } from "@/lib/asset-types";

type DetailItem = {
  id: string;
  pillar: string;
  content_type: string;
  format: string;
  title: string;
  hook: string | null;
  roteiro: string | null;
  caption: string | null;
  hashtags: string[] | null;
  platforms: string[];
  status: string;
  asset: ContentAsset;
  scheduled_at: string | null;
  rejection_note: string | null;
};

function emptyPrompt(): AssetPrompt {
  return { label: "", tool: ASSET_PROMPT_TOOLS[0], model: "", prompt: "", aspect_ratio: "9:16", notes: "" };
}

export function ContentDetail({ item }: { item: DetailItem }) {
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [hook, setHook] = useState(item.hook ?? "");
  const [roteiro, setRoteiro] = useState(item.roteiro ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [hashtagsText, setHashtagsText] = useState((item.hashtags ?? []).join(" "));
  const [prompts, setPrompts] = useState<AssetPrompt[]>(item.asset?.prompts ?? []);

  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    item.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : ""
  );

  const standby = item.asset?.standby === "depende-igor";
  const media = item.asset?.media;
  const late = isScheduledLate(item.scheduled_at) && (item.status === "em_revisao" || item.status === "aprovado");

  async function save() {
    setSaving(true);
    setSaveOk(false);
    setErr(null);
    try {
      const hashtags = hashtagsText
        .split(/\s+/)
        .map((h) => h.trim())
        .filter(Boolean);
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "edit",
          fields: {
            title,
            hook,
            roteiro,
            caption,
            hashtags,
            asset: { prompts },
          },
        }),
      });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra aprovar.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!note.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", rejection_note: note }),
      });
      setRejecting(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra rejeitar.");
    } finally {
      setBusy(false);
    }
  }

  async function schedule() {
    if (!scheduledAt) return;
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "schedule", scheduled_at: new Date(scheduledAt).toISOString() }),
      });
      setScheduling(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra agendar.");
    } finally {
      setBusy(false);
    }
  }

  function updatePrompt(index: number, patch: Partial<AssetPrompt>) {
    setPrompts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removePrompt(index: number) {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
  }

  function addPrompt() {
    setPrompts((prev) => [...prev, emptyPrompt()]);
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/fila"
        className="inline-block text-sm text-areia/50 hover:text-areia"
      >
        ← Voltar pra fila
      </Link>

      <div className="rounded-xl border border-areia/10 bg-breu/60 px-4 py-3 flex items-center gap-2 flex-wrap text-sm">
        <span className="font-semibold text-areia">
          {item.platforms.length > 0 ? item.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ") : "sem plataforma"}
        </span>
        <span className="text-areia/30">·</span>
        <span className={late ? "font-semibold text-ambar" : "text-areia/70"}>{formatScheduledAt(item.scheduled_at)}</span>
        {late && (
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-ambar/15 text-ambar px-2 py-0.5">
            atrasado
          </span>
        )}
        <span className="ml-auto text-xs uppercase tracking-wide rounded-full border border-dourado/40 text-dourado px-2.5 py-1">
          {ITEM_STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <ContentTypeBadge contentType={item.content_type} />
          <span className="text-xs uppercase tracking-wide rounded-full bg-ambar/15 text-ambar px-2.5 py-1">
            {PILLAR_LABELS[item.pillar] ?? item.pillar}
          </span>
          <span className="text-xs uppercase tracking-wide rounded-full bg-areia/10 text-areia/70 px-2.5 py-1">
            {FORMAT_LABELS[item.format] ?? item.format}
          </span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-ambar text-breu text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-40"
        >
          {saveOk ? "Salvo" : saving ? "Salvando..." : "Salvar edição"}
        </button>
      </div>

      {standby && (
        <p className="text-xs text-ambar/80 bg-ambar/10 border border-ambar/20 rounded-lg px-3 py-2">
          Essa peça depende de gravação ou aprovação do Igor. Não dá pra agendar até isso resolver.
        </p>
      )}

      {item.status === "rejeitado" && item.rejection_note && (
        <p className="text-xs text-areia/60 bg-areia/5 border border-areia/10 rounded-lg px-3 py-2">
          Motivo da rejeição: {item.rejection_note}
        </p>
      )}

      {err && <p className="text-sm text-ambar/90">{err}</p>}

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Coluna esquerda: copy */}
        <div className="space-y-6">
          <Field label="Título">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-areia outline-none focus:border-ambar font-display"
            />
          </Field>

          <Field label="Hook (gancho de abertura)">
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
            />
          </Field>

          <Field label="Roteiro">
            <textarea
              value={roteiro}
              onChange={(e) => setRoteiro(e.target.value)}
              rows={10}
              className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar font-mono leading-relaxed"
            />
          </Field>

          <Field label="Legenda">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
            />
          </Field>

          <Field label="Hashtags (separadas por espaço)">
            <input
              value={hashtagsText}
              onChange={(e) => setHashtagsText(e.target.value)}
              className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
              placeholder="#alude #festa"
            />
          </Field>

          <div className="rounded-xl border border-areia/10 bg-breu/60 p-4 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-areia/50 font-semibold">Ações</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={approve}
                disabled={busy || item.status === "aprovado"}
                className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
              >
                Aprovar
              </button>
              <button
                onClick={() => setRejecting((v) => !v)}
                className="rounded-lg border border-areia/20 text-sm text-areia/80 px-3 py-1.5 hover:border-areia/40"
              >
                Rejeitar
              </button>
              <button
                onClick={() => setScheduling((v) => !v)}
                disabled={standby || item.status !== "aprovado"}
                title={standby ? "Depende do Igor" : item.status !== "aprovado" ? "Aprova primeiro" : ""}
                className="rounded-lg border border-areia/20 text-sm text-areia/80 px-3 py-1.5 hover:border-areia/40 disabled:opacity-30 disabled:hover:border-areia/20"
              >
                Agendar
              </button>
            </div>

            {rejecting && (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Por que essa peça não vai pra frente?"
                  className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
                />
                <button
                  onClick={reject}
                  disabled={busy || !note.trim()}
                  className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
                >
                  Confirmar rejeição
                </button>
              </div>
            )}

            {scheduling && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
                />
                <button
                  onClick={schedule}
                  disabled={busy || !scheduledAt}
                  className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
                >
                  Confirmar agendamento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: mídia */}
        <div className="space-y-6">
          <Field label="Mídia gerada">
            <div className="rounded-xl bg-breu/60 border border-areia/10 p-4">
              {media?.kind === "video" && media.video_url ? (
                <video src={media.video_url} controls playsInline className="w-full rounded-lg max-h-[60vh] bg-black" />
              ) : media?.kind === "carousel" && media.carousel_slides?.length ? (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {media.carousel_slides.map((s, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={s.url}
                      alt={s.alt ?? `slide ${i + 1}`}
                      className="h-64 rounded-lg border border-areia/10 shrink-0 snap-start"
                    />
                  ))}
                </div>
              ) : media?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.image_url} alt="" className="w-full rounded-lg" />
              ) : media?.video_url ? (
                <video src={media.video_url} controls playsInline className="w-full rounded-lg max-h-[60vh] bg-black" />
              ) : (
                <p className="text-xs text-areia/40 italic">
                  Mídia ainda não gerada. Aparece aqui quando a peça for produzida.
                </p>
              )}
            </div>
          </Field>

          <Field
            label="Direção de mídia"
            action={
              <button onClick={addPrompt} className="text-xs text-ambar hover:opacity-80">
                + prompt
              </button>
            }
          >
            <div className="rounded-xl bg-breu/60 border border-areia/10 p-4 space-y-4">
              {prompts.length === 0 ? (
                <p className="text-xs text-areia/40 italic">Nenhum prompt de mídia ainda.</p>
              ) : (
                prompts.map((p, i) => (
                  <div key={i} className="border-t border-areia/10 pt-4 first:border-t-0 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={p.label ?? ""}
                        onChange={(e) => updatePrompt(i, { label: e.target.value })}
                        placeholder={`cena ${i + 1}`}
                        className="flex-1 rounded-lg bg-noite border border-areia/15 px-2 py-1 text-xs text-areia outline-none focus:border-ambar"
                      />
                      <button onClick={() => removePrompt(i)} className="text-xs text-areia/40 hover:text-ambar shrink-0">
                        remover
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={p.tool ?? ASSET_PROMPT_TOOLS[0]}
                        onChange={(e) => updatePrompt(i, { tool: e.target.value })}
                        className="rounded-lg bg-noite border border-areia/15 px-2 py-1 text-[11px] text-areia outline-none focus:border-ambar"
                      >
                        {p.tool && !(ASSET_PROMPT_TOOLS as string[]).includes(p.tool) && (
                          <option value={p.tool}>{p.tool}</option>
                        )}
                        {ASSET_PROMPT_TOOLS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        value={p.model ?? ""}
                        onChange={(e) => updatePrompt(i, { model: e.target.value })}
                        placeholder="model"
                        className="rounded-lg bg-noite border border-areia/15 px-2 py-1 text-[11px] text-areia outline-none focus:border-ambar"
                      />
                      <input
                        value={p.aspect_ratio ?? ""}
                        onChange={(e) => updatePrompt(i, { aspect_ratio: e.target.value })}
                        placeholder="9:16"
                        className="rounded-lg bg-noite border border-areia/15 px-2 py-1 text-[11px] text-areia outline-none focus:border-ambar"
                      />
                    </div>
                    <textarea
                      value={p.prompt}
                      onChange={(e) => updatePrompt(i, { prompt: e.target.value })}
                      rows={4}
                      placeholder="Prompt de geração"
                      className="w-full rounded-lg bg-noite border border-areia/15 px-2 py-1.5 text-xs text-areia outline-none focus:border-ambar font-mono leading-relaxed"
                    />
                    <input
                      value={p.notes ?? ""}
                      onChange={(e) => updatePrompt(i, { notes: e.target.value })}
                      placeholder="notas"
                      className="w-full rounded-lg bg-noite border border-areia/15 px-2 py-1 text-[11px] text-areia/70 outline-none focus:border-ambar"
                    />
                  </div>
                ))
              )}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.16em] text-areia/50 font-semibold">{label}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
