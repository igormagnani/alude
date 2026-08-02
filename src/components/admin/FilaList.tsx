"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import {
  PILLAR_LABELS,
  FORMAT_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_QUADRANTS,
  CONTENT_TYPE_TO_QUADRANT,
  CONTENT_TYPE_QUADRANT_BADGE,
  formatScheduledAt,
  isScheduledLate,
} from "@/lib/content-constants";
import { getAssetThumbnail, hasGeneratedMedia, hasMediaPrompts, type ContentAsset } from "@/lib/asset-types";

const PILLAR_OPTIONS = Object.keys(PILLAR_LABELS);

export function ContentTypeBadge({ contentType }: { contentType: string }) {
  const quadrant = CONTENT_TYPE_TO_QUADRANT[contentType];
  const classes = quadrant ? CONTENT_TYPE_QUADRANT_BADGE[quadrant] : "bg-areia/10 text-areia/70";
  return (
    <span className={`text-xs uppercase tracking-wide rounded-full px-2.5 py-1 ${classes}`}>
      {CONTENT_TYPE_LABELS[contentType] ?? contentType}
    </span>
  );
}

type ContentItem = {
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
};

export function FilaList({ initialItems }: { initialItems: ContentItem[] }) {
  const [items, setItems] = useState(initialItems);

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-areia/40 italic">
        Fila vazia. Nada em rascunho ou em revisão esperando por você agora.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FilaCard key={item.id} item={item} onDone={() => remove(item.id)} />
      ))}
    </div>
  );
}

function FilaCard({ item, onDone }: { item: ContentItem; onDone: () => void }) {
  const router = useRouter();
  const thumb = getAssetThumbnail(item.asset);
  const mediaReady = hasGeneratedMedia(item.asset);
  const promptsReady = hasMediaPrompts(item.asset);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: item.title,
    hook: item.hook ?? "",
    caption: item.caption ?? "",
    pillar: item.pillar,
    content_type: item.content_type,
  });

  const standby = item.asset?.standby === "depende-igor";
  const late = isScheduledLate(item.scheduled_at) && (item.status === "em_revisao" || item.status === "aprovado");

  // Card inteiro linca pro detalhe, exceto quando o clique nasce em algo
  // interativo (botão, input, link, etc) ou o card já tem um form aberto.
  function goToDetail(e: React.MouseEvent<HTMLDivElement>) {
    if (editing || rejecting || scheduling) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, summary, details")) return;
    router.push(`/admin/fila/${item.id}`);
  }

  async function approve() {
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) });
      onDone();
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
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra rejeitar.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "edit", fields: form }),
      });
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra salvar.");
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
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra agendar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={goToDetail} className="rounded-xl border border-areia/10 bg-breu/60 p-5 cursor-pointer">
      <div className="mb-3 flex items-center gap-2 flex-wrap text-sm">
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
      </div>

      {thumb && (
        <div className="mb-3 -mt-1 overflow-hidden rounded-lg">
          {thumb.kind === "video" ? (
            <video src={thumb.url} muted preload="metadata" className="h-36 w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb.url} alt="" loading="lazy" className="h-36 w-full object-cover" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <ContentTypeBadge contentType={item.content_type} />
        <span className="text-xs uppercase tracking-wide rounded-full bg-ambar/15 text-ambar px-2.5 py-1">
          {PILLAR_LABELS[item.pillar] ?? item.pillar}
        </span>
        <span className="text-xs uppercase tracking-wide rounded-full bg-areia/10 text-areia/70 px-2.5 py-1">
          {FORMAT_LABELS[item.format] ?? item.format}
        </span>
        {promptsReady && (
          <span className="text-[10px] text-dourado/80" title="Direção de mídia preenchida">
            prompt ✓
          </span>
        )}
        {mediaReady && (
          <span className="text-[10px] text-ambar/80" title="Mídia gerada">
            mídia ✓
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-areia outline-none focus:border-ambar"
            placeholder="Título"
          />
          <input
            value={form.hook}
            onChange={(e) => setForm((f) => ({ ...f, hook: e.target.value }))}
            className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-areia outline-none focus:border-ambar"
            placeholder="Gancho de abertura"
          />
          <textarea
            value={form.caption}
            onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            rows={3}
            className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-areia outline-none focus:border-ambar"
            placeholder="Legenda"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-areia/50 mb-1">Tipo</label>
              <select
                value={form.content_type}
                onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
                className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
              >
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
            </div>
            <div>
              <label className="block text-xs text-areia/50 mb-1">Cenário</label>
              <select
                value={form.pillar}
                onChange={(e) => setForm((f) => ({ ...f, pillar: e.target.value }))}
                className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
              >
                {PILLAR_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PILLAR_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={busy} className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40">
              Salvar
            </button>
            <button onClick={() => setEditing(false)} className="rounded-lg text-sm text-areia/60 px-3 py-1.5 hover:text-areia">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-areia font-semibold">{item.title}</h3>
          {item.hook && <p className="text-sm text-dourado mt-1">{item.hook}</p>}
          {item.roteiro && (
            <details className="mt-2">
              <summary className="text-xs text-areia/50 cursor-pointer">Ver roteiro</summary>
              <p className="text-sm text-areia/70 whitespace-pre-wrap mt-2">{item.roteiro}</p>
            </details>
          )}
          {item.caption && <p className="text-sm text-areia/60 mt-2 whitespace-pre-wrap">{item.caption}</p>}
        </>
      )}

      {standby && (
        <p className="mt-3 text-xs text-ambar/80 bg-ambar/10 border border-ambar/20 rounded-lg px-3 py-2">
          Essa peça depende de gravação ou aprovação do Igor. Não dá pra agendar até isso resolver.
        </p>
      )}

      {err && <p className="mt-3 text-sm text-ambar/90">{err}</p>}

      {!editing && !rejecting && !scheduling && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={approve} disabled={busy} className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40">
            Aprovar
          </button>
          <button onClick={() => setRejecting(true)} className="rounded-lg border border-areia/20 text-sm text-areia/80 px-3 py-1.5 hover:border-areia/40">
            Rejeitar
          </button>
          <button onClick={() => setEditing(true)} className="rounded-lg border border-areia/20 text-sm text-areia/80 px-3 py-1.5 hover:border-areia/40">
            Editar
          </button>
          <button
            onClick={() => setScheduling(true)}
            disabled={standby || item.status !== "aprovado"}
            title={standby ? "Depende do Igor" : item.status !== "aprovado" ? "Aprova primeiro" : ""}
            className="rounded-lg border border-areia/20 text-sm text-areia/80 px-3 py-1.5 hover:border-areia/40 disabled:opacity-30 disabled:hover:border-areia/20"
          >
            Agendar
          </button>
        </div>
      )}

      {rejecting && (
        <div className="mt-4 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Por que essa peça não vai pra frente?"
            className="w-full rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          />
          <div className="flex gap-2">
            <button onClick={reject} disabled={busy || !note.trim()} className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40">
              Confirmar rejeição
            </button>
            <button onClick={() => setRejecting(false)} className="rounded-lg text-sm text-areia/60 px-3 py-1.5 hover:text-areia">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {scheduling && (
        <div className="mt-4 space-y-2">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded-lg bg-noite border border-areia/15 px-3 py-2 text-sm text-areia outline-none focus:border-ambar"
          />
          <div className="flex gap-2">
            <button onClick={schedule} disabled={busy || !scheduledAt} className="rounded-lg bg-ambar text-breu text-sm font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40">
              Confirmar agendamento
            </button>
            <button onClick={() => setScheduling(false)} className="rounded-lg text-sm text-areia/60 px-3 py-1.5 hover:text-areia">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
