import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { PreviewShell } from "@/components/admin/preview/PreviewShell";

export const dynamic = "force-dynamic";

/**
 * Preview IG (`/admin/p/[id]`): tela cheia com o mock real do Instagram pra
 * julgar a peça como o público vê. Busca o item, a lista de pendentes
 * (draft/em_revisao, mesma ordem cronológica da fila) pra derivar
 * anterior/próxima/posição, e — só quando já publicado — as publications pra
 * mostrar o link externo em vez da barra de julgamento.
 */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: item } = await supabaseAdmin
    .from("alude_content_items")
    .select("*, topic:alude_topics(title)")
    .eq("id", id)
    .single();
  if (!item) notFound();

  const { data: pendentes } = await supabaseAdmin
    .from("alude_content_items")
    .select("id")
    .in("status", ["draft", "em_revisao"])
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const pendingIds = (pendentes ?? []).map((p) => p.id as string);
  const index = pendingIds.indexOf(id);
  const prevId = index > 0 ? pendingIds[index - 1] : null;
  const nextId = index >= 0 && index < pendingIds.length - 1 ? pendingIds[index + 1] : null;
  const position = index >= 0 ? `${index + 1} de ${pendingIds.length}` : null;

  let publications: { platform: string; external_url: string | null }[] = [];
  if (item.status === "publicado") {
    const { data: pubs } = await supabaseAdmin
      .from("alude_publications")
      .select("platform, external_url")
      .eq("item_id", id);
    publications = pubs ?? [];
  }

  return (
    <PreviewShell item={item} prevId={prevId} nextId={nextId} position={position} publications={publications} />
  );
}
