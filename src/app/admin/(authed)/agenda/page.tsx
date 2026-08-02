import { supabaseAdmin } from "@/lib/supabase";
import { AgendaView } from "@/components/admin/AgendaTimeline";
import { SectionHeader } from "@/components/admin/ui";

export default async function AgendaPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  const now = new Date();

  const [{ data: items }, { data: overdue }, { data: settingsRow }] = await Promise.all([
    supabaseAdmin
      .from("alude_content_items")
      .select("id, title, format, platforms, status, scheduled_at, asset")
      .in("status", ["aprovado", "agendado"])
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", start.toISOString())
      .lt("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true }),
    // Atrasadas: proposta de horário já passou e a peça não avançou (ainda em
    // revisão, ou aprovada mas o cron não pegou). Fora da janela de 14 dias
    // de propósito, pra nunca sumir só porque ficou velho.
    supabaseAdmin
      .from("alude_content_items")
      .select("id, title, format, platforms, status, scheduled_at, asset")
      .in("status", ["em_revisao", "aprovado"])
      .not("scheduled_at", "is", null)
      .lt("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "slots").single(),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Agenda" title="Próximas 2 semanas" />
      <AgendaView
        startIso={start.toISOString()}
        items={items ?? []}
        overdue={overdue ?? []}
        slots={(settingsRow?.value as Record<string, Array<{ dia: string; hora: string; formato: string }>>) ?? {}}
      />
    </div>
  );
}
