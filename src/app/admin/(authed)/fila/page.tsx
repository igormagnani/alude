import { supabaseAdmin } from "@/lib/supabase";
import { FilaList } from "@/components/admin/FilaList";

export default async function FilaPage() {
  const { data: items } = await supabaseAdmin
    .from("alude_content_items")
    .select("*")
    .in("status", ["draft", "em_revisao"])
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Fila</p>
        <h1 className="display text-3xl text-areia">O que está esperando revisão</h1>
      </div>
      <FilaList initialItems={items ?? []} />
    </div>
  );
}
