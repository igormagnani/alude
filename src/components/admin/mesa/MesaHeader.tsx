"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";

/**
 * Cabeçalho da Mesa: "N esperando você" é a única coisa que precisa saltar
 * aos olhos em 5 segundos, então fica em Archivo display grande. O
 * kill-switch de produção vira um pill compacto ao lado — âmbar só quando
 * desligada (pede ação), neutro quando ligada (não precisa de atenção).
 */
export function MesaHeader({ ligada, pendentesCount }: { ligada: boolean; pendentesCount: number }) {
  const router = useRouter();
  const [on, setOn] = useState(ligada);
  const [busy, setBusy] = useState(false);

  async function alternar() {
    setBusy(true);
    try {
      await adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ producao_ligada: !on }) });
      setOn((v) => !v);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-dourado">Mesa</p>
        <h1 className="display text-3xl text-areia sm:text-4xl">
          {pendentesCount > 0 ? (
            <>
              <span className="text-ambar">{pendentesCount}</span> esperando você
            </>
          ) : (
            "Mesa limpa"
          )}
        </h1>
      </div>
      <button
        type="button"
        onClick={alternar}
        disabled={busy}
        className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 disabled:opacity-60 ${
          on
            ? "border-areia/15 text-areia/50 hover:text-areia"
            : "border-ambar/40 bg-ambar/10 text-ambar"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${on ? "bg-areia/30" : "bg-ambar"}`} aria-hidden />
        {busy ? "…" : on ? "Produção ligada" : "Produção desligada"}
      </button>
    </div>
  );
}
