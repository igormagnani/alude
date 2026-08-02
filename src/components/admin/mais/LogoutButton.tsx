"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/ui";

/**
 * Mesmo padrão de saída do AdminSidebar (POST /api/admin/logout + redirect),
 * só que como botão próprio: no mobile a sidebar some e quem navega é a
 * AdminTabBar de 3 itens, então "Mais" precisa da própria saída.
 */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sair() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={sair} disabled={busy}>
      {busy ? "Saindo…" : "Sair"}
    </Button>
  );
}
