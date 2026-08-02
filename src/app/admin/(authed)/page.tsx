import { supabaseAdmin } from "@/lib/supabase";
import { MesaHeader } from "@/components/admin/mesa/MesaHeader";
import { PrecisaDeVoce } from "@/components/admin/mesa/PrecisaDeVoce";
import { MesaTimeline } from "@/components/admin/mesa/MesaTimeline";
import { PublicadasRecentes, type PublicadaItem } from "@/components/admin/mesa/PublicadasRecentes";

const MESA_FIELDS = "id, title, format, platforms, status, scheduled_at, asset";

/**
 * Mesa (`/admin`): home única que substitui Painel + Fila + Agenda. Cinco
 * buscas em paralelo; nenhuma delas decide o que é "hoje" — isso é trabalho
 * do MesaTimeline via Intl + America/Sao_Paulo, nunca do fuso do servidor.
 * "Atrasadas" não tem limite de janela de propósito (mesma regra da Agenda
 * antiga): uma peça esquecida há 3 semanas continua visível até alguém
 * decidir o que fazer com ela, nunca some sozinha.
 */
export default async function MesaPage() {
  const now = new Date();
  const nowIso = now.toISOString();
  const windowEnd = new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: pendentes },
    { data: agendados },
    { data: atrasadas },
    { data: publicacoes },
    { data: producaoRow },
    { data: slotsRow },
  ] = await Promise.all([
    supabaseAdmin
      .from("alude_content_items")
      .select(MESA_FIELDS)
      .in("status", ["draft", "em_revisao"])
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("alude_content_items")
      .select(MESA_FIELDS)
      .in("status", ["aprovado", "agendado"])
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", nowIso)
      .lte("scheduled_at", windowEnd)
      .order("scheduled_at", { ascending: true }),
    supabaseAdmin
      .from("alude_content_items")
      .select(MESA_FIELDS)
      .in("status", ["em_revisao", "aprovado"])
      .not("scheduled_at", "is", null)
      .lt("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true }),
    supabaseAdmin
      .from("alude_publications")
      .select("id, platform, published_at, external_url, metrics, item:alude_content_items(id, title, format, asset)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "producao_ligada").single(),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "slots").single(),
  ]);

  const pendentesComData = (pendentes ?? []).filter(
    (p) => p.scheduled_at && new Date(p.scheduled_at).getTime() >= now.getTime()
  );

  return (
    <div className="space-y-10">
      <MesaHeader ligada={producaoRow?.value === true} pendentesCount={pendentes?.length ?? 0} />

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Precisa de você</h2>
        <PrecisaDeVoce items={pendentes ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Timeline</h2>
        <MesaTimeline
          agendados={agendados ?? []}
          pendentesComData={pendentesComData}
          atrasadas={atrasadas ?? []}
          slots={(slotsRow?.value as Record<string, Array<{ dia: string; hora: string; formato: string }>>) ?? {}}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Publicadas recentemente</h2>
        <PublicadasRecentes publications={(publicacoes ?? []) as unknown as PublicadaItem[]} />
      </section>
    </div>
  );
}
