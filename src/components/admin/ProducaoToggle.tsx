"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";

export function ProducaoToggle({ ligada }: { ligada: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function alternar() {
    setLoading(true);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ producao_ligada: !ligada }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (ligada) {
    return (
      <button
        onClick={alternar}
        disabled={loading}
        className="text-xs text-areia/50 hover:text-areia underline underline-offset-2 disabled:opacity-40"
      >
        Desligar produção
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-ambar/30 bg-ambar/10 px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-ambar font-semibold">Produção desligada</p>
        <p className="text-sm text-areia/60 mt-0.5">
          O cron de publicação não vai enfileirar nem publicar nada enquanto isso ficar desligado.
        </p>
      </div>
      <button
        onClick={alternar}
        disabled={loading}
        className="shrink-0 rounded-lg bg-ambar text-breu font-semibold px-4 py-2 text-sm hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Ligando..." : "Ligar produção"}
      </button>
    </div>
  );
}
