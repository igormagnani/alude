import { redirect } from "next/navigation";

/** Rota velha: a agenda virou a timeline da Mesa (/admin) na Fase 3. */
export default function AgendaPage() {
  redirect("/admin");
}
