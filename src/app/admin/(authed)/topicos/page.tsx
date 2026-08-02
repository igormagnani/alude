import { redirect } from "next/navigation";

/** Rota velha: Pauta mora em /admin/pauta desde a Fase 2 da re-arquitetura. */
export default function TopicosPage() {
  redirect("/admin/pauta");
}
