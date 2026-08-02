"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import {
  PILLAR_LABELS,
  FORMAT_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_QUADRANTS,
  CONTENT_TYPES,
  ITEM_STATUS_LABELS,
  formatScheduledAt,
  isScheduledLate,
} from "@/lib/content-constants";
import { ASSET_PROMPT_TOOLS, type AssetPrompt, type ContentAsset } from "@/lib/asset-types";
import {
  Badge,
  Button,
  Card,
  ContentTypeBadge,
  Input,
  Select,
  Textarea,
  type BadgeTone,
} from "@/components/admin/ui";

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

const PILLAR_OPTIONS = Object.keys(PILLAR_LABELS);
const FORMAT_OPTIONS = Object.keys(FORMAT_LABELS);
const PLATFORM_OPTIONS = Object.keys(PLATFORM_LABELS);

function statusTone(status: string): BadgeTone {
  if (status === "rejeitado") return "brasa";
  if (status === "aprovado" || status === "agendado" || status === "publicado") return "dourado";
  return "neutral";
}

function emptyPrompt(): AssetPrompt {
  return { label: "", tool: ASSET_PROMPT_TOOLS[0], model: "", prompt: "", aspect_ratio: "9:16", notes: "" };
}

/**
 * Editor puro (`/admin/editar/[id]`): só copy + direção de mídia. O
 * julgamento (aprovar/ajustar horário/rejeitar) mora inteiro na JudgmentBar
 * do Preview IG (`/admin/p/[id]`) desde a Fase 4 da re-arquitetura — este
 * componente não chama nenhuma action de status, só `edit`.
 */
export function ContentDetail({ item }: { item: DetailItem }) {
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [hook, setHook] = useState(item.hook ?? "");
  const [roteiro, setRoteiro] = useState(item.roteiro ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [hashtagsText, setHashtagsText] = useState((item.hashtags ?? []).join(" "));
  const [contentType, setContentType] = useState(item.content_type);
  const [pillar, setPillar] = useState(item.pillar);
  const [format, setFormat] = useState(item.format);
  const [platforms, setPlatforms] = useState<string[]>(item.platforms);
  const [prompts, setPrompts] = useState<AssetPrompt[]>(item.asset?.prompts ?? []);

  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const standby = item.asset?.standby === "depende-igor";
  const media = item.asset?.media;
  const late = isScheduledLate(item.scheduled_at) && item.status !== "rejeitado";

  const displayStatus = item.status === "aprovado" && item.scheduled_at ? "agendado" : item.status;

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
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
            content_type: contentType,
            pillar,
            format,
            platforms,
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/admin" className="inline-block text-sm text-areia/50 hover:text-areia">
          ← Voltar pra Mesa
        </Link>
        <Link
          href={`/admin/p/${item.id}`}
          className="inline-block text-sm text-dourado hover:text-ambar"
        >
          ver preview →
        </Link>
      </div>

      <Card padding="sm" className="flex items-center gap-2 flex-wrap text-sm">
        <span className="font-semibold text-areia">
          {platforms.length > 0 ? platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ") : "sem plataforma"}
        </span>
        <span className="text-areia/30">·</span>
        <span className={`display text-lg leading-none ${late ? "text-brasa" : "text-areia"}`}>
          {formatScheduledAt(item.scheduled_at)}
        </span>
        {late && <Badge tone="brasa">atrasado</Badge>}
        {item.topic?.title && (
          <span className="w-full text-xs text-areia/50 sm:w-auto sm:ml-1">da pauta: {item.topic.title}</span>
        )}
        <span className="ml-auto">
          <Badge tone={statusTone(displayStatus)}>{ITEM_STATUS_LABELS[displayStatus] ?? displayStatus}</Badge>
        </span>
      </Card>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ContentTypeBadge contentType={contentType} />
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo de conteúdo">
              <Select value={contentType} onChange={(e) => setContentType(e.target.value)}>
                {CONTENT_TYPE_QUADRANTS.map((q) => (
                  <optgroup key={q.key} label={q.label}>
                    {q.types.map((t) => (
                      <option key={t} value={t}>
                        {CONTENT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </optgroup>
                ))}
                {!CONTENT_TYPES.includes(contentType) && <option value={contentType}>{contentType}</option>}
              </Select>
            </Field>

            <Field label="Cenário">
              <Select value={pillar} onChange={(e) => setPillar(e.target.value)}>
                {PILLAR_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PILLAR_LABELS[p]}
                  </option>
                ))}
                {!PILLAR_OPTIONS.includes(pillar) && <option value={pillar}>{pillar}</option>}
              </Select>
            </Field>

            <Field label="Formato">
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
                {!FORMAT_OPTIONS.includes(format) && <option value={format}>{format}</option>}
              </Select>
            </Field>
          </div>

          <Field label="Plataformas">
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                    platforms.includes(p)
                      ? "border-dourado bg-dourado/15 text-dourado"
                      : "border-areia/20 text-areia/60 hover:border-areia/40"
                  }`}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </Field>
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
