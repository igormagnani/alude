import { supabaseAdmin } from "@/lib/supabase";
import { AgendaGrid } from "@/components/admin/AgendaGrid";

export default async function AgendaPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const [{ data: items }, { data: settingsRow }] = await Promise.all([
    supabaseAdmin
      .from("alude_content_items")
      .select("id, title, format, platforms, status, scheduled_at")
      .in("status", ["aprovado", "agendado"])
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", start.toISOString())
      .lt("scheduled_at", end.toISOString()),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "slots").single(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Agenda</p>
        <h1 className="display text-3xl text-areia">Próximas 2 semanas</h1>
      </div>
      <AgendaGrid
        startIso={start.toISOString()}
        items={items ?? []}
        slots={(settingsRow?.value as Record<string, Array<{ dia: string; hora: string; formato: string }>>) ?? {}}
      />
    </div>
  );
}
