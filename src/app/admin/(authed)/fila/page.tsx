import { supabaseAdmin } from "@/lib/supabase";
import { ReviewFeed } from "@/components/admin/ReviewFeed";
import { SectionHeader } from "@/components/admin/ui";

export default async function FilaPage() {
  const { data: items } = await supabaseAdmin
    .from("alude_content_items")
    .select("*, topic:alude_topics(title)")
    .in("status", ["draft", "em_revisao", "rejeitado"])
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const count = items?.length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={count > 0 ? `${count} esperando você` : "Fila"}
        title="Revisão"
      />
      <ReviewFeed initialItems={items ?? []} />
    </div>
  );
}
