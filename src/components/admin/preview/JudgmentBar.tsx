"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { formatScheduledAt, isScheduledLate, toLocalInputValue } from "@/lib/content-constants";
import { Button, Input, Textarea } from "@/components/admin/ui";
import type { PreviewItem } from "./shared";

/** Espelha APPROVE_FROM da API (api/admin/items/[id]/route.ts) e do ContentDetail. */
const APPROVE_FROM = ["draft", "em_revisao", "aprovado", "rejeitado"];

const REJECTION_CHIPS = ["copy fraca", "mídia fraca", "horário", "outro"] as const;

/**
 * Barra de julgamento fixa embaixo do Preview: aprovar em 1 toque, ajustar
 * horário ou rejeitar com motivo. Mesma lógica de ações do ContentDetail
 * (reaproveitada aqui, não importada, porque o Editor não muda nesta fase).
 * `onDone` é chamado só depois da mutação confirmar: quem decide pra onde ir
 * (próximo pendente ou /admin/fila) é o PreviewShell.
 */
export function JudgmentBar({ item, onDone }: { item: PreviewItem; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [picker, setPicker] = useState<"approve" | "change" | null>(null);
  const [pickerValue, setPickerValue] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const standby = item.asset?.standby === "depende-igor";
  const hasFutureSchedule = Boolean(item.scheduled_at) && !isScheduledLate(item.scheduled_at);
  const canApprove = APPROVE_FROM.includes(item.status);
  const canChangeTime = item.status !== "publicado" && item.status !== "arquivado";
  const canReject = item.status !== "publicado" && item.status !== "arquivado";

  function closeSecondary() {
    setPicker(null);
    setRejecting(false);
    setChips([]);
    setNote("");
    setErr(null);
  }

  function toggleChip(chip: string) {
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  }

  async function approveAndSchedule(iso: string) {
    setBusy(true);
    setErr(null);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "approve_and_schedule", scheduled_at: iso }),
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra aprovar.");
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
      // Item já aprovado/agendado: `schedule` também atualiza as
      // alude_publications pendentes; senão é só um `edit` de scheduled_at.
      const action = item.status === "aprovado" || item.status === "agendado" ? "schedule" : "edit";
      const body =
        action === "schedule" ? { action, scheduled_at: iso } : { action, fields: { scheduled_at: iso } };
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra mudar o horário.");
      setBusy(false);
    }
  }

  async function confirmReject() {
    if (chips.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const notaTrim = note.trim();
      const rejection_note = notaTrim ? `${chips.join(", ")}: ${notaTrim}` : chips.join(", ");
      await adminFetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", rejection_note }),
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra rejeitar.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-breu/95 px-3 pt-3 backdrop-blur"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {err && <p className="mb-2 text-xs text-brasa">{err}</p>}

      {picker ? (
        <div className="space-y-2 pb-1">
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
            <Button variant="ghost" onClick={closeSecondary}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : rejecting ? (
        <div className="space-y-2 pb-1">
          <div className="flex flex-wrap gap-1.5">
            {REJECTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                  chips.includes(chip)
                    ? "border-brasa bg-brasa/15 text-brasa"
                    : "border-areia/20 text-areia/60 hover:border-areia/40"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Nota opcional" />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmReject}
              disabled={busy || chips.length === 0}
            >
              {busy ? "Rejeitando…" : "Confirmar rejeição"}
            </Button>
            <Button variant="ghost" onClick={closeSecondary}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pb-2">
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
          <div className="flex gap-2">
            {canChangeTime && (
              <Button variant="secondary" className="flex-1" onClick={openChangePicker}>
                Ajustar horário
              </Button>
            )}
            {canReject && (
              <Button variant="destructive" className="flex-1" onClick={() => setRejecting(true)}>
                Rejeitar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
