"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import {
  PILLAR_LABELS,
  FORMAT_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_TO_QUADRANT,
  type ContentTypeQuadrant,
  formatScheduledAt,
  isScheduledLate,
  toLocalInputValue,
} from "@/lib/content-constants";
import { getAssetThumbnail, hasGeneratedMedia, hasMediaPrompts, type ContentAsset } from "@/lib/asset-types";
import { Badge, Button, Card, EmptyState, Input, Textarea, type BadgeTone } from "@/components/admin/ui";

/**
 * Tom por quadrante do content_type. Reaproveita os 4 tons semânticos do
 * design system (nunca mistura bg/text de dois tons no mesmo elemento — ver
 * nota em ui.tsx sobre não confiar em ordem de classe do Tailwind pra
 * "sobrescrever" cor). "Convocar" ganha só uma borda por cima, que é aditivo
 * e não compete com o tom.
 */
const QUADRANT_TONE: Record<ContentTypeQuadrant, BadgeTone> = {
  entreter: "ambar",
  inspirar: "dourado",
  curadoria: "neutral",
  convocar: "ambar",
};
const QUADRANT_EXTRA: Partial<Record<ContentTypeQuadrant, string>> = {
  convocar: "border border-ambar/40",
};

export function ContentTypeBadge({ contentType }: { contentType: string }) {
  const quadrant = CONTENT_TYPE_TO_QUADRANT[contentType];
  const tone = quadrant ? QUADRANT_TONE[quadrant] : "neutral";
  const extra = quadrant ? QUADRANT_EXTRA[quadrant] : undefined;
  return (
    <Badge tone={tone} className={extra}>
      {CONTENT_TYPE_LABELS[contentType] ?? contentType}
    </Badge>
  );
}

export type ReviewItem = {
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

export function ReviewFeed({ initialItems }: { initialItems: ReviewItem[] }) {
  const [items, setItems] = useState(initialItems);

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function patch(id: string, fields: Partial<ReviewItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...fields } : i)));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Fila vazia"
        description="Nada esperando por você agora. Volta quando a produção soltar peça nova."
      />
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <ReviewCard
          key={item.id}
          item={item}
          onApproved={() => remove(item.id)}
          onUpdated={(fields) => patch(item.id, fields)}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  item,
  onApproved,
  onUpdated,
}: {
  item: ReviewItem;
  onApproved: () => void;
  onUpdated: (fields: Partial<ReviewItem>) => void;
}) {
  const router = useRouter();
  const thumb = getAssetThumbnail(item.asset);
  const mediaReady = hasGeneratedMedia(item.asset);
  const promptsReady = hasMediaPrompts(item.asset);
  const standby = item.asset?.standby === "depende-igor";
  const late = isScheduledLate(item.scheduled_at) && item.status !== "rejeitado";
  const hasFutureSchedule = Boolean(item.scheduled_at) && !isScheduledLate(item.scheduled_at);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [picker, setPicker] = useState<"approve" | "change" | null>(null);
  const [pickerValue, setPickerValue] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  function leave() {
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onApproved();
      return;
    }
    setLeaving(true);
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
      leave();
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
    setPicker("approve");
    setPickerValue(toLocalInputValue(item.scheduled_at));
  }

  function openChangePicker() {
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
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "edit", fields: { scheduled_at: iso } }),
      });
      onUpdated({ scheduled_at: iso });
      setPicker(null);
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
      onUpdated({ status: "rejeitado", rejection_note: note });
      setRejecting(false);
      setNote("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra rejeitar.");
    } finally {
      setBusy(false);
    }
  }

  // Card inteiro linca pro detalhe, exceto cliques que nascem em algo
  // interativo (vídeo com controls, botão, campo, etc) ou com um form aberto.
  function goToDetail(e: React.MouseEvent<HTMLDivElement>) {
    if (picker || rejecting) return;
    const target = e.target as HTMLElement;
    if (target.closest("video, button, a, input, textarea, select, summary, details")) return;
    router.push(`/admin/fila/${item.id}`);
  }

  return (
    <Card
      padding="none"
      className={`overflow-hidden ${leaving ? "admin-card-out" : ""}`}
      onAnimationEnd={() => {
        if (leaving) onApproved();
      }}
    >
      <div onClick={goToDetail} className="cursor-pointer">
        {/* Mídia: 4:5, o que domina o card */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-noite">
          {thumb ? (
            thumb.kind === "video" ? (
              <video
                src={thumb.url}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            )
          ) : (
            <EmptyMedia />
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="pointer-events-auto">
              <ContentTypeBadge contentType={item.content_type} />
            </span>
            {late && (
              <span className="pointer-events-auto">
                <Badge tone="brasa">atrasado</Badge>
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Data/hora: o sinal mais proeminente do card */}
          <div>
            <p className={`display text-xl leading-none sm:text-2xl ${late ? "text-brasa" : "text-areia"}`}>
              {formatScheduledAt(item.scheduled_at)}
            </p>
            <p className="mt-1.5 text-xs text-areia/50">
              {item.platforms.length > 0
                ? item.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ")
                : "sem plataforma"}
              {item.topic?.title && <> · da pauta: {item.topic.title}</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="dourado">{PILLAR_LABELS[item.pillar] ?? item.pillar}</Badge>
            <Badge tone="neutral">{FORMAT_LABELS[item.format] ?? item.format}</Badge>
            {item.status === "rejeitado" && <Badge tone="brasa">rejeitado</Badge>}
          </div>

          <div>
            <h3 className="font-semibold leading-snug text-areia">{item.title}</h3>
            {item.hook && <p className="mt-1 text-sm text-dourado">{item.hook}</p>}
          </div>

          {(promptsReady || mediaReady) && (
            <p className="text-[11px] text-areia/40">
              {[promptsReady && "direção de mídia pronta", mediaReady && "mídia gerada"]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {(item.roteiro || item.caption) && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-areia/50 transition-colors duration-150 hover:text-areia/70">
                <span className="inline-block transition-transform duration-150 group-open:rotate-90">›</span>
                roteiro e legenda
              </summary>
              <div className="mt-2 space-y-3">
                {item.roteiro && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-areia/70">{item.roteiro}</p>
                )}
                {item.caption && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-areia/60">{item.caption}</p>
                )}
              </div>
            </details>
          )}

          {standby && (
            <p className="rounded-lg border border-brasa/20 bg-brasa/10 px-3 py-2 text-xs text-brasa">
              Depende de gravação ou aprovação do Igor. Não dá pra agendar até resolver isso.
            </p>
          )}

          {item.status === "rejeitado" && item.rejection_note && (
            <p className="rounded-lg border border-brasa/20 bg-brasa/10 px-3 py-2 text-xs text-brasa">
              Rejeitado: {item.rejection_note}
            </p>
          )}

          {err && <p className="text-xs text-brasa">{err}</p>}
        </div>
      </div>

      <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
        {picker ? (
          <div className="space-y-2">
            <Input
              type="datetime-local"
              value={pickerValue}
              onChange={(e) => setPickerValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={confirmPicker} disabled={busy || !pickerValue}>
                {busy ? "Confirmando…" : picker === "approve" ? "Confirmar aprovação" : "Confirmar novo horário"}
              </Button>
              <Button variant="ghost" onClick={() => setPicker(null)}>
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
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmReject}
                disabled={busy || !note.trim()}
              >
                {busy ? "Rejeitando…" : "Confirmar rejeição"}
              </Button>
              <Button variant="ghost" onClick={() => setRejecting(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
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
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={openChangePicker}>
                Mudar horário
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setRejecting(true)}>
                Rejeitar
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function EmptyMedia() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8 text-areia/20"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M21 15l-4.5-4.5a2 2 0 0 0-2.8 0L7 17" />
      </svg>
      <p className="text-xs italic text-areia/30">Mídia ainda não gerada</p>
    </div>
  );
}
