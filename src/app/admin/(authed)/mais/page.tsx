import { supabaseAdmin } from "@/lib/supabase";
import { SectionHeader } from "@/components/admin/ui";
import { MixBalanceBars } from "@/components/admin/mais/MixBalanceBars";
import { MelhoresPiores, type RankedPublication } from "@/components/admin/mais/MelhoresPiores";
import { LogoutButton } from "@/components/admin/mais/LogoutButton";
import { ConfiguracoesPanel } from "@/components/admin/ConfiguracoesPanel";
import { MixWeightsEditor } from "@/components/admin/MixWeightsEditor";

/**
 * Mais (`/admin/mais`): tudo que não é triagem do dia a dia — leitura de
 * performance (mix vs alvo, melhores/piores) + configurações + sair.
 * Substitui Performance e Configurações como páginas próprias (redirects nos
 * stubs). Melhores/piores ordena em memória (limit 100 publicações
 * publicadas), nunca no banco: são poucas linhas e a query fica simples.
 */
export default async function MaisPage() {
  const [{ data: mixBalance }, { data: pubs }, { data: mixRow }, { data: historyRow }, { data: producaoRow }, { data: slotsRow }] =
    await Promise.all([
      supabaseAdmin.from("alude_mix_balance").select("*"),
      supabaseAdmin
        .from("alude_publications")
        .select("id, platform, published_at, metrics, item:alude_content_items(id, title)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(100),
      supabaseAdmin.from("alude_settings").select("value").eq("key", "mix_weights").single(),
      supabaseAdmin.from("alude_settings").select("value").eq("key", "mix_weights_history").single(),
      supabaseAdmin.from("alude_settings").select("value").eq("key", "producao_ligada").single(),
      supabaseAdmin.from("alude_settings").select("value").eq("key", "slots").single(),
    ]);

  const mixWeights = (mixRow?.value as Record<string, number>) ?? {};
  const history =
    (historyRow?.value as Array<{ at: string; weights: Record<string, number>; motivo: string | null }>) ?? [];

  const withReach = (pubs ?? []).filter(
    (p) => typeof (p.metrics as { reach?: number } | null)?.reach === "number"
  ) as unknown as RankedPublication[];
  const sorted = [...withReach].sort((a, b) => (b.metrics?.reach ?? 0) - (a.metrics?.reach ?? 0));
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.length > 3 ? sorted.slice(Math.max(3, sorted.length - 3)).reverse() : [];

  return (
    <div className="space-y-10">
      <SectionHeader eyebrow="Mais" title="O resto que importa" />

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Mix vs alvo · 28 dias</h2>
        <MixBalanceBars rows={mixBalance ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Melhores e piores</h2>
        <MelhoresPiores top3={top3} bottom3={bottom3} />
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Configurações</h2>
        <ConfiguracoesPanel
          producaoLigada={producaoRow?.value === true}
          slots={(slotsRow?.value as Record<string, Array<{ dia: string; hora: string; formato: string }>>) ?? {}}
          igConfigurado={Boolean(process.env.ALUDE_IG_USER_ID && process.env.ALUDE_IG_ACCESS_TOKEN)}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-areia/50">Mix de tipos</h2>
        <MixWeightsEditor initialWeights={mixWeights} history={history} />
      </section>

      <section className="border-t border-areia/10 pt-6">
        <LogoutButton />
      </section>
    </div>
  );
}
