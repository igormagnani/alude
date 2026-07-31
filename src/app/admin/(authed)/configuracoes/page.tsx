import { supabaseAdmin } from "@/lib/supabase";
import { ConfiguracoesPanel } from "@/components/admin/ConfiguracoesPanel";

export default async function ConfiguracoesPage() {
  const [{ data: producaoRow }, { data: slotsRow }] = await Promise.all([
    supabaseAdmin.from("alude_settings").select("value").eq("key", "producao_ligada").single(),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "slots").single(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Configurações</p>
        <h1 className="display text-3xl text-areia">Produção e grade de horários</h1>
      </div>
      <ConfiguracoesPanel
        producaoLigada={producaoRow?.value === true}
        slots={(slotsRow?.value as Record<string, Array<{ dia: string; hora: string; formato: string }>>) ?? {}}
        igConfigurado={Boolean(process.env.ALUDE_IG_USER_ID && process.env.ALUDE_IG_ACCESS_TOKEN)}
      />
    </div>
  );
}
