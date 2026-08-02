import Link from "next/link";
import { PLATFORM_LABELS, FORMAT_LABELS } from "@/lib/content-constants";
import { getAssetThumbnail, type ContentAsset } from "@/lib/asset-types";
import { Badge, Card, EmptyState, type BadgeTone } from "@/components/admin/ui";

export type MesaTimelineItem = {
  id: string;
  title: string;
  format: string;
  platforms: string[];
  status: string;
  scheduled_at: string;
  asset: ContentAsset;
};

type Slot = { dia: string; hora: string; formato: string };

/**
 * Agrupamento por dia SEMPRE via Intl.DateTimeFormat com timeZone
 * America/Sao_Paulo, nunca `toDateString()`: o servidor roda em UTC, e às
 * 21h-23h59 em São Paulo o UTC já virou o dia seguinte — `toDateString`
 * jogaria a peça pro dia errado da timeline. `spTodayYMD` ancora "hoje" no
 * calendário de SP; os 14 dias nascem daí, sempre ao meio-dia UTC (nunca
 * cruza fronteira de dia mesmo em fusos até ±11h de UTC).
 */
function spTodayYMD(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { y: get("year"), m: get("month"), d: get("day") };
}

function dayKeySP(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function weekdayKeySP(date: Date): string {
  const raw = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" })
    .format(date)
    .replace(".", "")
    .toLowerCase();
  return raw === "sáb" ? "sab" : raw;
}

function dayLabelSP(date: Date): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday").replace(".", "")} ${get("day")}/${get("month")}`;
}

function formatHourSP(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function statusLabel(item: MesaTimelineItem, isPending: boolean): { label: string; tone: BadgeTone } {
  if (isPending) return { label: "esperando você", tone: "ambar" };
  if (item.status === "aprovado") return { label: "aprovada · na fila", tone: "dourado" };
  if (item.status === "agendado") return { label: "agendada", tone: "dourado" };
  if (item.status === "publicado") return { label: "publicada", tone: "dourado" };
  return { label: item.status, tone: "neutral" };
}

/**
 * Timeline vertical contínua da Mesa: atrasadas em brasa no topo (único
 * lugar da Mesa onde brasa aparece), HOJE destacado, depois os 13 dias
 * seguintes. Cada dia mistura peças já agendadas/aprovadas com pendentes que
 * têm um horário proposto (badge âmbar "esperando você" — a mesma cor de
 * "precisa de ação" do resto da Mesa). Slots livres aparecem discretos, sem
 * disputar atenção com peças reais.
 */
export function MesaTimeline({
  agendados,
  pendentesComData,
  atrasadas,
  slots,
}: {
  agendados: MesaTimelineItem[];
  pendentesComData: MesaTimelineItem[];
  atrasadas: MesaTimelineItem[];
  slots: Record<string, Slot[]>;
}) {
  const pendingIds = new Set(pendentesComData.map((p) => p.id));
  const dayItems = [...agendados, ...pendentesComData];

  const today = spTodayYMD();
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(today.y, today.m - 1, today.d + i, 12, 0, 0)));

  const totalOnDays = days.reduce((acc, day) => {
    const key = dayKeySP(day.toISOString());
    return acc + dayItems.filter((it) => dayKeySP(it.scheduled_at) === key).length;
  }, 0);

  if (atrasadas.length === 0 && totalOnDays === 0) {
    return <EmptyState title="Mesa limpa" description="Nada esperando você nas próximas 2 semanas." />;
  }

  return (
    <div className="space-y-8">
      {atrasadas.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brasa" aria-hidden />
            <h2 className="display text-sm text-brasa">Atrasadas · {atrasadas.length}</h2>
          </div>
          <div className="space-y-2">
            {atrasadas
              .slice()
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .map((item) => (
                <MesaRow key={item.id} item={item} late />
              ))}
          </div>
        </section>
      )}

      <div className="space-y-6">
        {days.map((day, i) => {
          const key = dayKeySP(day.toISOString());
          const items = dayItems
            .filter((it) => dayKeySP(it.scheduled_at) === key)
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          const free = freeSlotsForDay(day, items, slots);
          const isToday = i === 0;

          return (
            <section key={key}>
              <div
                className={`sticky top-0 z-10 -mx-1 px-1 py-2 backdrop-blur ${
                  isToday ? "bg-ambar/10" : "bg-noite/95"
                }`}
              >
                <h2
                  className={
                    isToday
                      ? "display text-base text-ambar"
                      : "text-xs font-semibold uppercase tracking-[0.16em] text-areia/50"
                  }
                >
                  {isToday ? "Hoje" : dayLabelSP(day)}
                </h2>
              </div>
              <div className="mt-2 space-y-2">
                {items.length === 0 && free.length === 0 && (
                  <p className="px-1 text-xs italic text-areia/25">nada marcado</p>
                )}
                {items.map((item) => (
                  <MesaRow key={item.id} item={item} pending={pendingIds.has(item.id)} />
                ))}
                {free.map((slot, idx) => (
                  <p key={idx} className="px-1 text-[11px] text-areia/30">
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

function freeSlotsForDay(day: Date, dayItems: MesaTimelineItem[], slots: Record<string, Slot[]>) {
  const diaKey = weekdayKeySP(day);
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

function MesaRow({ item, late = false, pending = false }: { item: MesaTimelineItem; late?: boolean; pending?: boolean }) {
  const thumb = getAssetThumbnail(item.asset);
  const { label, tone } = statusLabel(item, pending);

  return (
    <Card padding="sm" className={late ? "border-brasa/20 bg-brasa/5" : ""}>
      <Link href={`/admin/p/${item.id}`} className="flex items-center gap-3">
        <span className={`display w-11 shrink-0 text-xs ${late ? "text-brasa" : "text-areia/50"}`}>
          {formatHourSP(item.scheduled_at)}
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
        <span className="flex shrink-0 items-center gap-1.5">
          {late && <Badge tone="brasa">atrasada</Badge>}
          <Badge tone={tone}>{label}</Badge>
        </span>
      </Link>
    </Card>
  );
}
