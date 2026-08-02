import { redirect } from "next/navigation";

/** Rota velha: o detalhe de fila virou o Preview IG (/admin/p/[id]) na Fase 1. */
export default async function FilaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/p/${id}`);
}
