import { redirect } from "next/navigation";

/** Rota velha: performance agora é uma seção de /admin/mais desde a Fase 2. */
export default function PerformancePage() {
  redirect("/admin/mais");
}
