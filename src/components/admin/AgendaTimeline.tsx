"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import {
  PLATFORM_LABELS,
  FORMAT_LABELS,
  ITEM_STATUS_LABELS,
  toLocalInputValue,
} from "@/lib/content-constants";
import { getAssetThumbnail, type ContentAsset } from "@/lib/asset-types";
import { Badge, Button, Card, EmptyState, Input, type BadgeTone } from "@/components/admin/ui";
import { AgendaGrid } from "@/components/admin/AgendaGrid";

const DIA_BY_GETDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

export type AgendaItem = {
  id: string;
  title: string;
  format: string;
  platforms: string[];
  status: string;
  scheduled_at: string;
  asset: ContentAsset;
};

type Slot = { dia: string; hora: string; formato: string };

/** Status coerente com ContentDetail/ReviewFeed: aprovado + scheduled_at já lê como "Agendado". */
function displayStatus(item: { status: string; scheduled_at: string }): string {
  return item.status === "aprovado" && item.scheduled_at ? "agendado" : item.status;
}

function statusTone(status: string): BadgeTone {
  if (status === "rejeitado") return "brasa";
  if (status === "aprovado" || status === "agendado" || status === "publicado") return "dourado";
  return "neutral";
}

function formatHour(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function dayLabel(d: Date): string {
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const dm = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${weekday} ${dm}`;
}

/**
 * Agenda em lista vertical (mobile-first): 14 dias com header sticky, item por
 * horário, reagendar inline. "Atrasadas" (em_revisao/aprovado com scheduled_at
 * já passado) sobe pro topo em brasa: é o único sinal de erro da agenda.
 */
export function AgendaView({
  startIso,
  items,
  overdue,
  slots,
}: {
  startIso: string;
  items: AgendaItem[];
  overdue: AgendaItem[];
  slots: Record<string, Slot[]>;
}) {
  const [view, setView] = useState<"lista" | "grade">("lista");

  return (
    <div className="space-y-6">
      <div className="hidden items-center gap-1 rounded-lg border border-areia/10 bg-breu/60 p-1 lg:inline-flex">
        <button
          onClick={() => setView("lista")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            view === "lista" ? "bg-ambar text-breu" : "text-areia/60 hover:text-areia"
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => setView("grade")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
            view === "grade" ? "bg-ambar text-breu" : "text-areia/60 hover:text-areia"
          }`}
        >
          Grade
        </button>
      </div>

      <div className={view === "lista" ? "" : "hidden"}>
        <AgendaTimeline startIso={startIso} items={items} overdue={overdue} slots={slots} />
      </div>

      {view === "grade" && (
        <div className="hidden lg:block">
          <AgendaGrid startIso={startIso} items={[...items, ...overdue]} slots={slots} />
        </div>
      )}
    </div>
  );
}

export function AgendaTimeline({
  startIso,
  items,
  overdue,
  slots,
}: {
  startIso: string;
  items: AgendaItem[];
  overdue: AgendaItem[];
  slots: Record<string, Slot[]>;
}) {
  const overdueIds = new Set(overdue.map((i) => i.id));
  const scheduledItems = items.filter((i) => !overdueIds.has(i.id));

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startIso);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (items.length === 0 && overdue.length === 0) {
    return <EmptyState title="Agenda limpa" description="Nada marcado pras próximas 2 semanas ainda." />;
  }

  return (
    <div className="space-y-8">
      {overdue.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brasa" aria-hidden />
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brasa">
              Atrasadas · {overdue.length}
            </h2>
          </div>
          <div className="space-y-2">
            {overdue
              .slice()
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .map((item) => (
                <AgendaRow key={item.id} item={item} late />
              ))}
          </div>
        </section>
      )}

      <div className="space-y-6">
        {days.map((day) => {
          const dayItems = scheduledItems
            .filter((item) => new Date(item.scheduled_at).toDateString() === day.toDateString())
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          const free = freeSlotsForDay(day, dayItems, slots);

          return (
            <section key={day.toISOString()}>
              <div className="sticky top-0 z-10 -mx-1 bg-noite/95 px-1 py-2 backdrop-blur">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-areia/50">
                  {dayLabel(day)}
                </h2>
              </div>
              <div className="mt-2 space-y-2">
                {dayItems.length === 0 && free.length === 0 && (
                  <p className="px-1 text-xs italic text-areia/25">nada marcado</p>
                )}
                {dayItems.map((item) => (
                  <AgendaRow key={item.id} item={item} />
                ))}
                {free.map((slot, i) => (
                  <p key={i} className="px-1 text-[11px] text-areia/30">
                    slot livre · {PLATFORM_LABELS[slot.platform] ?? slot.platform} ·{" "}
                    {FORMAT_LABELS[slot.formato]?.toLowerCase() ?? slot.formato} · {slot.hora}
                  </p>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function freeSlotsForDay(day: Date, dayItems: AgendaItem[], slots: Record<string, Slot[]>) {
  const diaKey = DIA_BY_GETDAY[day.getDay()];
  const filledPlatforms = new Set(dayItems.flatMap((i) => i.platforms));
  const free: { platform: string; hora: string; formato: string }[] = [];
  for (const platform of Object.keys(slots)) {
    if (filledPlatforms.has(platform)) continue;
    for (const slot of slots[platform] ?? []) {
      if (slot.dia === diaKey) free.push({ platform, hora: slot.hora, formato: slot.formato });
    }
  }
  return free;
}

function AgendaRow({ item, late = false }: { item: AgendaItem; late?: boolean }) {
  const router = useRouter();
  const thumb = getAssetThumbnail(item.asset);
  const status = displayStatus(item);
  const pseudoAgendado = !late && item.status === "aprovado" && Boolean(item.scheduled_at);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function openEdit() {
    setEditing(true);
    setValue(toLocalInputValue(item.scheduled_at));
  }

  async function confirm() {
    if (!value) return;
    setBusy(true);
    setErr(null);
    try {
      const iso = new Date(value).toISOString();
      const action = item.status === "aprovado" || item.status === "agendado" ? "schedule" : "edit";
      const body = action === "schedule" ? { action, scheduled_at: iso } : { action, fields: { scheduled_at: iso } };
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra mudar o horário.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="sm" className={late ? "border-brasa/20 bg-brasa/5" : ""}>
      <div className="flex items-center gap-3">
        <Link href={`/admin/fila/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className={`w-11 shrink-0 text-xs tabular-nums ${late ? "text-brasa" : "text-areia/50"}`}>
            {formatHour(item.scheduled_at)}
          </span>
          <span className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-noite">
            {thumb ? (
              thumb.kind === "video" ? (
                <video src={thumb.url} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm text-areia">{item.title}</p>
            <p className="mt-0.5 truncate text-[11px] text-areia/40">
              {item.platforms.length > 0 ? item.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ") : "sem plataforma"}
            </p>
          </span>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            {late && <Badge tone="brasa">atrasado</Badge>}
            <Badge tone={statusTone(status)}>{ITEM_STATUS_LABELS[status] ?? status}</Badge>
          </div>
          {pseudoAgendado && <p className="text-[10px] text-areia/35">ainda entra na fila do cron</p>}
          {!editing && (
            <button
              onClick={openEdit}
              className="text-[11px] text-areia/40 transition-colors duration-150 hover:text-areia"
            >
              mudar horário
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-areia/10 pt-3">
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-auto flex-1"
            autoFocus
          />
          <Button variant="primary" onClick={confirm} disabled={busy || !value}>
            {busy ? "Salvando…" : "Confirmar"}
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          {err && <p className="w-full text-xs text-brasa">{err}</p>}
        </div>
      )}
    </Card>
  );
}
