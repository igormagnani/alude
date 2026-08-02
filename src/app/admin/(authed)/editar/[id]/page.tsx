import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ContentDetail } from "@/components/admin/ContentDetail";

export const dynamic = "force-dynamic";

/**
 * Editor (`/admin/editar/[id]`): mesma rota conceitual de `/admin/fila/[id]`,
 * caminho novo pra bater com a arquitetura de 3 áreas (Mesa/Preview/Editor).
 * ContentDetail não muda nesta fase — o julgamento sai dele só na Fase 4.
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
