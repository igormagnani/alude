"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import { PLATFORM_LABELS, FORMAT_LABELS, DIA_LABELS } from "@/lib/content-constants";
import { getAssetThumbnail, type ContentAsset } from "@/lib/asset-types";

const DIA_BY_GETDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const PLATFORMS = ["instagram", "tiktok", "youtube", "spotify"];

type Item = {
  id: string;
  title: string;
  format: string;
  platforms: string[];
  status: string;
  scheduled_at: string;
  asset?: ContentAsset;
};

type Slot = { dia: string; hora: string; formato: string };

export function AgendaGrid({
  startIso,
  items,
  slots,
}: {
  startIso: string;
  items: Item[];
  slots: Record<string, Slot[]>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startIso);
    d.setDate(d.getDate() + i);
    return d;
  });

  function itemsFor(platform: string, day: Date) {
    return items.filter((item) => {
      if (!item.platforms.includes(platform)) return false;
      const scheduled = new Date(item.scheduled_at);
      return scheduled.toDateString() === day.toDateString();
    });
  }

  function slotFor(platform: string, day: Date): Slot | undefined {
    const diaKey = DIA_BY_GETDAY[day.getDay()];
    return (slots[platform] ?? []).find((s) => s.dia === diaKey);
  }

  async function saveEdit(item: Item) {
    if (!value) return;
    setBusy(true);
    setErr(null);
    try {
      const action = item.status === "aprovado" ? "schedule" : "edit";
      const body =
        action === "schedule"
          ? { action, scheduled_at: new Date(value).toISOString() }
          : { action, fields: { scheduled_at: new Date(value).toISOString() } };
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra mudar a data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1100px] space-y-3">
        <div className="grid grid-cols-[100px_repeat(14,1fr)] gap-1.5">
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="text-center">
              <p className="text-[11px] text-areia/40 uppercase">{DIA_LABELS[DIA_BY_GETDAY[d.getDay()]]}</p>
              <p className="text-xs text-areia/60">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
            </div>
          ))}
        </div>

        {PLATFORMS.map((platform) => (
          <div key={platform} className="grid grid-cols-[100px_repeat(14,1fr)] gap-1.5">
            <div className="flex items-center text-xs text-areia/60">{PLATFORM_LABELS[platform]}</div>
            {days.map((day) => {
              const dayItems = itemsFor(platform, day);
              const slot = slotFor(platform, day);
              return (
                <div key={day.toISOString()} className="min-h-[54px] rounded-lg border border-areia/10 bg-breu/50 p-1.5">
                  {dayItems.length > 0 ? (
                    dayItems.map((item) => {
                      const thumb = getAssetThumbnail(item.asset ?? null);
                      return (
                        <div key={item.id}>
                          {editingId === item.id ? (
                            <div className="space-y-1">
                              <input
                                type="datetime-local"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full text-[10px] rounded bg-noite border border-areia/15 text-areia px-1 py-0.5 outline-none focus:border-ambar"
                              />
                              <div className="flex gap-1">
                                <button onClick={() => saveEdit(item)} disabled={busy} className="text-[10px] text-ambar">
                                  Salvar
                                </button>
                                <button onClick={() => setEditingId(null)} className="text-[10px] text-areia/50">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <Link
                                href={`/admin/fila/${item.id}`}
                                className="flex items-center gap-1.5 rounded bg-ambar/15 hover:bg-ambar/25 transition-colors px-1.5 py-1"
                              >
                                {thumb && (
                                  <span className="h-7 w-7 shrink-0 overflow-hidden rounded">
                                    {thumb.kind === "video" ? (
                                      <video src={thumb.url} muted preload="metadata" className="h-full w-full object-cover" />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                                    )}
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <p className="text-[10px] text-ambar/90">
                                    {new Date(item.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                  <p className="text-[11px] text-areia leading-tight line-clamp-2">{item.title}</p>
                                </span>
                              </Link>
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setValue(new Date(item.scheduled_at).toISOString().slice(0, 16));
                                }}
                                className="text-[9px] text-areia/40 hover:text-areia px-1.5"
                              >
                                editar hora
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : slot ? (
                    <p className="text-[10px] text-areia/25 leading-tight px-1 py-1">
                      slot {FORMAT_LABELS[slot.formato]?.toLowerCase() ?? slot.formato} {slot.hora}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-ambar/90">{err}</p>}
    </div>
  );
}
