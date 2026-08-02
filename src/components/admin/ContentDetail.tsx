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
  toLocalInputValue,
} from "@/lib/content-constants";
import { ContentTypeBadge } from "@/components/admin/ReviewFeed";
import { ASSET_PROMPT_TOOLS, type AssetPrompt, type ContentAsset } from "@/lib/asset-types";
import { Badge, Button, Card, Input, Select, Textarea, type BadgeTone } from "@/components/admin/ui";

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
  topic: { title: string } | null;
};

/** Status de onde dá pra aprovar em 1 toque (espelha a API). */
const APPROVE_FROM = ["draft", "em_revisao", "aprovado", "rejeitado"];

function statusTone(status: string): BadgeTone {
  if (status === "rejeitado") return "brasa";
  if (status === "aprovado" || status === "agendado" || status === "publicado") return "dourado";
  return "neutral";
}

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

  const [picker, setPicker] = useState<"approve" | "change" | null>(null);
  const [pickerValue, setPickerValue] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [archiving, setArchiving] = useState(false);

  const standby = item.asset?.standby === "depende-igor";
  const media = item.asset?.media;
  const late = isScheduledLate(item.scheduled_at) && item.status !== "rejeitado";
  const hasFutureSchedule = Boolean(item.scheduled_at) && !isScheduledLate(item.scheduled_at);

  const displayStatus = item.status === "aprovado" && item.scheduled_at ? "agendado" : item.status;
  const canApprove = APPROVE_FROM.includes(item.status);
  const canChangeTime = item.status !== "publicado" && item.status !== "arquivado";
  const canReject = item.status !== "publicado" && item.status !== "arquivado";
  const canArchive = item.status !== "arquivado";

  function closeSecondary() {
    setPicker(null);
    setRejecting(false);
    setArchiving(false);
  }

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

  async function approveAndSchedule(iso: string) {
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve_and_schedule", scheduled_at: iso }),
      });
      setPicker(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra aprovar.");
    } finally {
      setBusy(false);
    }
  }

  function approveNow() {
    if (!item.scheduled_at) return;
    approveAndSchedule(item.scheduled_at);
  }

  function openApprovePicker() {
    closeSecondary();
    setPicker("approve");
    setPickerValue(toLocalInputValue(item.scheduled_at));
  }

  function openChangePicker() {
    closeSecondary();
    setPicker("change");
    setPickerValue(toLocalInputValue(item.scheduled_at));
  }

  async function confirmPicker() {
    if (!pickerValue) return;
    const iso = new Date(pickerValue).toISOString();
    if (picker === "approve") {
      await approveAndSchedule(iso);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      // Item já aprovado/agendado: usa a action `schedule`, que também
      // atualiza as alude_publications pendentes (corrige o bug de
      // reagendamento). Ainda em revisão: só edita o horário proposto.
      const action = item.status === "aprovado" || item.status === "agendado" ? "schedule" : "edit";
      const body =
        action === "schedule" ? { action, scheduled_at: iso } : { action, fields: { scheduled_at: iso } };
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setPicker(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra mudar o horário.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReject() {
    if (!note.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", rejection_note: note }),
      });
      setRejecting(false);
      setNote("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra rejeitar.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmArchive() {
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "archive" }),
      });
      setArchiving(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra arquivar.");
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
      <Link href="/admin/fila" className="inline-block text-sm text-areia/50 hover:text-areia">
        ← Voltar pra fila
      </Link>

      <Card padding="sm" className="flex items-center gap-2 flex-wrap text-sm">
        <span className="font-semibold text-areia">
          {item.platforms.length > 0 ? item.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ") : "sem plataforma"}
        </span>
        <span className="text-areia/30">·</span>
        <span className={`display text-lg leading-none ${late ? "text-brasa" : "text-areia"}`}>
          {formatScheduledAt(item.scheduled_at)}
        </span>
        {late && <Badge tone="brasa">atrasado</Badge>}
        {item.topic?.title && (
          <span className="w-full text-xs text-areia/50 sm:w-auto sm:ml-1">da pauta: {item.topic.title}</span>
        )}
        <span className="ml-auto flex flex-col items-end gap-1">
          <Badge tone={statusTone(displayStatus)}>{ITEM_STATUS_LABELS[displayStatus] ?? displayStatus}</Badge>
          {displayStatus === "agendado" && (
            <span className="text-[10px] text-areia/40">entra na fila de publicação em minutos</span>
          )}
        </span>
      </Card>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <ContentTypeBadge contentType={item.content_type} />
          <Badge tone="dourado">{PILLAR_LABELS[item.pillar] ?? item.pillar}</Badge>
          <Badge tone="neutral">{FORMAT_LABELS[item.format] ?? item.format}</Badge>
        </div>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saveOk ? "Salvo" : saving ? "Salvando..." : "Salvar edição"}
        </Button>
      </div>

      {standby && (
        <p className="rounded-lg border border-brasa/20 bg-brasa/10 px-3 py-2 text-xs text-brasa">
          Essa peça depende de gravação ou aprovação do Igor. Não dá pra agendar até isso resolver.
        </p>
      )}

      {item.status === "rejeitado" && item.rejection_note && (
        <p className="rounded-lg border border-brasa/20 bg-brasa/10 px-3 py-2 text-xs text-brasa">
          Rejeitado: {item.rejection_note}
        </p>
      )}

      {err && <p className="text-sm text-brasa">{err}</p>}

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Coluna de copy: no mobile vem depois da mídia (que leva order-first) */}
        <div className="space-y-6">
          <Field label="Título">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-display"
            />
          </Field>

          <Field label="Hook (gancho de abertura)">
            <Textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={2} />
          </Field>

          <Field label="Roteiro">
            <Textarea
              value={roteiro}
              onChange={(e) => setRoteiro(e.target.value)}
              rows={10}
              className="font-mono leading-relaxed"
            />
          </Field>

          <Field label="Legenda">
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} />
          </Field>

          <Field label="Hashtags (separadas por espaço)">
            <Input
              value={hashtagsText}
              onChange={(e) => setHashtagsText(e.target.value)}
              placeholder="#alude #festa"
            />
          </Field>

          <Card padding="md" className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-areia/50">Ações</p>

            {picker ? (
              <div className="space-y-2">
                <Input
                  type="datetime-local"
                  value={pickerValue}
                  onChange={(e) => setPickerValue(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={confirmPicker} disabled={busy || !pickerValue}>
                    {busy ? "Confirmando…" : picker === "approve" ? "Confirmar aprovação" : "Confirmar novo horário"}
                  </Button>
                  <Button variant="ghost" onClick={closeSecondary}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : rejecting ? (
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Por que essa peça não vai pra frente?"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive" onClick={confirmReject} disabled={busy || !note.trim()}>
                    {busy ? "Rejeitando…" : "Confirmar rejeição"}
                  </Button>
                  <Button variant="ghost" onClick={closeSecondary}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : archiving ? (
              <div className="space-y-2">
                <p className="text-xs text-areia/60">
                  Arquivar tira essa peça do fluxo de revisão e agenda de vez. Confirma?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive" onClick={confirmArchive} disabled={busy}>
                    {busy ? "Arquivando…" : "Confirmar arquivamento"}
                  </Button>
                  <Button variant="ghost" onClick={closeSecondary}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {canApprove && (
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={busy || standby}
                    onClick={hasFutureSchedule ? approveNow : openApprovePicker}
                  >
                    {busy
                      ? "Aprovando…"
                      : hasFutureSchedule
                        ? `Aprovar · ${formatScheduledAt(item.scheduled_at)}`
                        : "Aprovar e escolher horário"}
                  </Button>
                )}
                <div className="flex flex-wrap gap-2">
                  {canChangeTime && (
                    <Button variant="secondary" className="flex-1" onClick={openChangePicker}>
                      Mudar horário
                    </Button>
                  )}
                  {canReject && (
                    <Button variant="destructive" className="flex-1" onClick={() => setRejecting(true)}>
                      Rejeitar
                    </Button>
                  )}
                </div>
                {canArchive && (
                  <Button variant="secondary" className="w-full" onClick={() => setArchiving(true)}>
                    Arquivar
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Coluna de mídia: no mobile vem primeiro */}
        <div className="order-first space-y-6 lg:order-none">
          <Field label="Mídia gerada">
            <Card padding="md">
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
            </Card>
          </Field>

          <Field
            label="Direção de mídia"
            action={
              <button onClick={addPrompt} className="text-xs text-ambar hover:opacity-80">
                + prompt
              </button>
            }
          >
            <Card padding="md" className="space-y-4">
              {prompts.length === 0 ? (
                <p className="text-xs text-areia/40 italic">Nenhum prompt de mídia ainda.</p>
              ) : (
                prompts.map((p, i) => (
                  <div key={i} className="border-t border-areia/10 pt-4 first:border-t-0 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={p.label ?? ""}
                        onChange={(e) => updatePrompt(i, { label: e.target.value })}
                        placeholder={`cena ${i + 1}`}
                        className="flex-1 py-1! text-xs!"
                      />
                      <button onClick={() => removePrompt(i)} className="text-xs text-areia/40 hover:text-brasa shrink-0">
                        remover
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={p.tool ?? ASSET_PROMPT_TOOLS[0]}
                        onChange={(e) => updatePrompt(i, { tool: e.target.value })}
                        className="py-1! text-[11px]!"
                      >
                        {p.tool && !(ASSET_PROMPT_TOOLS as string[]).includes(p.tool) && (
                          <option value={p.tool}>{p.tool}</option>
                        )}
                        {ASSET_PROMPT_TOOLS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                      <Input
                        value={p.model ?? ""}
                        onChange={(e) => updatePrompt(i, { model: e.target.value })}
                        placeholder="model"
                        className="py-1! text-[11px]!"
                      />
                      <Input
                        value={p.aspect_ratio ?? ""}
                        onChange={(e) => updatePrompt(i, { aspect_ratio: e.target.value })}
                        placeholder="9:16"
                        className="py-1! text-[11px]!"
                      />
                    </div>
                    <Textarea
                      value={p.prompt}
                      onChange={(e) => updatePrompt(i, { prompt: e.target.value })}
                      rows={4}
                      placeholder="Prompt de geração"
                      className="py-1.5! text-xs! font-mono leading-relaxed"
                    />
                    <Input
                      value={p.notes ?? ""}
                      onChange={(e) => updatePrompt(i, { notes: e.target.value })}
                      placeholder="notas"
                      className="py-1! text-[11px]! text-areia/70!"
                    />
                  </div>
                ))
              )}
            </Card>
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
