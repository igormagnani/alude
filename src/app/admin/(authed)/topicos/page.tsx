import { supabaseAdmin } from "@/lib/supabase";
import { TopicosList } from "@/components/admin/TopicosList";

export default async function TopicosPage() {
  const { data: topics } = await supabaseAdmin
    .from("alude_topics")
    .select("*")
    .neq("status", "descartado")
    .order("score", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Tópicos</p>
        <h1 className="display text-3xl text-areia">Funil de ideias</h1>
      </div>
      <TopicosList initialTopics={topics ?? []} />
    </div>
  );
}
