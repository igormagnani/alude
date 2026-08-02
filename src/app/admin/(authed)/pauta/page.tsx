import { supabaseAdmin } from "@/lib/supabase";
import { TopicosList } from "@/components/admin/TopicosList";
import { SectionHeader } from "@/components/admin/ui";

/**
 * Pauta (`/admin/pauta`): funil de ideias. `used_item_id` não tem FK (tópicos
 * podem apontar pra itens já arquivados/removidos), então o embed do Supabase
 * cairia na relação errada — resolvemos com uma segunda query manual pelos
 * ids usados e um map em memória, igual ao Preview IG resolve `topic:` no
 * sentido inverso.
 */
export default async function PautaPage() {
  const { data: topics } = await supabaseAdmin
    .from("alude_topics")
    .select("*")
    .neq("status", "descartado")
    .order("score", { ascending: false });

  const usedItemIds = Array.from(
    new Set((topics ?? []).map((t) => t.used_item_id as string | null).filter((id): id is string => Boolean(id)))
  );

  let usedItems: { id: string; title: string }[] = [];
  if (usedItemIds.length > 0) {
    const { data } = await supabaseAdmin.from("alude_content_items").select("id, title").in("id", usedItemIds);
    usedItems = data ?? [];
  }
  const usedItemsById = new Map(usedItems.map((i) => [i.id, i]));

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Pauta" title="Funil de ideias" />
      <TopicosList initialTopics={topics ?? []} usedItemsById={Object.fromEntries(usedItemsById)} />
    </div>
  );
}
