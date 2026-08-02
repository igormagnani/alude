import { redirect } from "next/navigation";

/** Rota velha: configurações agora é uma seção de /admin/mais desde a Fase 2. */
export default function ConfiguracoesPage() {
  redirect("/admin/mais");
}
