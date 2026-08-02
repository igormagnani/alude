import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ContentDetail } from "@/components/admin/ContentDetail";

export const dynamic = "force-dynamic";

/**
 * Editor (`/admin/editar/[id]`): só copy + direção de mídia. O julgamento
 * (aprovar/ajustar horário/rejeitar) mora na JudgmentBar do Preview IG
 * (`/admin/p/[id]`) desde a Fase 4 da re-arquitetura.
 */
export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: item } = await supabaseAdmin
    .from("alude_content_items")
    .select("*, topic:alude_topics(title)")
    .eq("id", id)
    .single();
  if (!item) notFound();

  return <ContentDetail item={item} />;
}
