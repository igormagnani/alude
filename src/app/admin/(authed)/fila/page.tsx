import { redirect } from "next/navigation";

/** Rota velha: a fila virou a Mesa (/admin) na Fase 3 da re-arquitetura. */
export default function FilaPage() {
  redirect("/admin");
}
