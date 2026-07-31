"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import { DIA_LABELS, DIA_ORDER, FORMAT_LABELS, PLATFORM_LABELS } from "@/lib/content-constants";

type Slot = { dia: string; hora: string; formato: string };

const PLATFORMS = ["instagram", "tiktok", "youtube", "spotify"];
const FORMAT_OPTIONS = Object.keys(FORMAT_LABELS);

export function ConfiguracoesPanel({
  producaoLigada,
  slots,
  igConfigurado,
}: {
  producaoLigada: boolean;
  slots: Record<string, Slot[]>;
  igConfigurado: boolean;
}) {
  const router = useRouter();
  const [ligada, setLigada] = useState(producaoLigada);
  const [localSlots, setLocalSlots] = useState<Record<string, Slot[]>>(slots);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function alternarProducao() {
    setBusy(true);
    try {
      await adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ producao_ligada: !ligada }) });
      setLigada(!ligada);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function updateSlot(platform: string, idx: number, patch: Partial<Slot>) {
    setLocalSlots((prev) => ({
      ...prev,
      [platform]: prev[platform].map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function addSlot(platform: string) {
    setLocalSlots((prev) => ({
      ...prev,
      [platform]: [...(prev[platform] ?? []), { dia: "ter", hora: "19:00", formato: "reel" }],
    }));
  }

  function removeSlot(platform: string, idx: number) {
    setLocalSlots((prev) => ({ ...prev, [platform]: prev[platform].filter((_, i) => i !== idx) }));
  }

  async function salvarSlots() {
    setBusy(true);
    setMsg(null);
    try {
      await adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ slots: localSlots }) });
      setMsg("Grade salva.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não deu pra salvar a grade.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Produção</h2>
        <div className="rounded-xl border border-areia/10 bg-breu/60 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-areia">{ligada ? "Produção ligada" : "Produção desligada"}</p>
            <p className="text-sm text-areia/50 mt-0.5">
              {ligada
                ? "O cron enfileira e publica peças aprovadas com data marcada."
                : "O cron não faz nada até você ligar de novo."}
            </p>
          </div>
          <button
            onClick={alternarProducao}
            disabled={busy}
            className={`rounded-full w-12 h-7 relative transition-colors ${ligada ? "bg-ambar" : "bg-areia/20"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-breu transition-transform ${ligada ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Conexões</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { nome: "Instagram", ok: igConfigurado },
            { nome: "TikTok", ok: false },
            { nome: "YouTube", ok: false },
          ].map((c) => (
            <div key={c.nome} className="rounded-lg border border-areia/10 bg-breu/60 px-4 py-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${c.ok ? "bg-ambar" : "bg-areia/25"}`} />
              <span className="text-sm text-areia/80">{c.nome}</span>
              <span className="text-xs text-areia/40">{c.ok ? "configurado" : "aguardando conexão"}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Grade de horários</h2>
        <div className="space-y-4">
          {PLATFORMS.map((platform) => (
            <div key={platform} className="rounded-xl border border-areia/10 bg-breu/60 p-4">
              <p className="text-sm text-areia mb-3">{PLATFORM_LABELS[platform]}</p>
              <div className="space-y-2">
                {(localSlots[platform] ?? []).map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={slot.dia}
                      onChange={(e) => updateSlot(platform, idx, { dia: e.target.value })}
                      className="rounded-lg bg-noite border border-areia/15 px-2 py-1.5 text-sm text-areia outline-none focus:border-ambar"
                    >
                      {DIA_ORDER.map((d) => (
                        <option key={d} value={d}>
                          {DIA_LABELS[d]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.hora}
                      onChange={(e) => updateSlot(platform, idx, { hora: e.target.value })}
                      className="rounded-lg bg-noite border border-areia/15 px-2 py-1.5 text-sm text-areia outline-none focus:border-ambar"
                    />
                    <select
                      value={slot.formato}
                      onChange={(e) => updateSlot(platform, idx, { formato: e.target.value })}
                      className="rounded-lg bg-noite border border-areia/15 px-2 py-1.5 text-sm text-areia outline-none focus:border-ambar"
                    >
                      {FORMAT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {FORMAT_LABELS[f]}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removeSlot(platform, idx)} className="text-xs text-areia/40 hover:text-ambar">
                      remover
                    </button>
                  </div>
                ))}
                <button onClick={() => addSlot(platform)} className="text-xs text-dourado hover:text-ambar">
                  + adicionar horário
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={salvarSlots} disabled={busy} className="rounded-lg bg-ambar text-breu text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-40">
            Salvar grade
          </button>
          {msg && <p className="text-sm text-areia/60">{msg}</p>}
        </div>
      </section>
    </div>
  );
}
