import { supabaseAdmin } from "@/lib/supabase";
import {
  PILLAR_LABELS,
  FORMAT_LABELS,
  PLATFORM_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_QUADRANTS,
} from "@/lib/content-constants";
import { MixWeightsEditor } from "@/components/admin/MixWeightsEditor";

const CONTENT_TYPES = CONTENT_TYPE_QUADRANTS.flatMap((q) => q.types);

function fmtReach(v: number | null) {
  if (v == null) return "sem dado";
  return Math.round(v).toLocaleString("pt-BR");
}

function fmtSavesPorReach(v: number | null) {
  if (v == null) return "sem dado";
  return `${(v * 100).toFixed(1)}%`;
}

export default async function PerformancePage() {
  const [
    { data: mixBalance },
    { data: mixPerformance },
    { data: pillarBalance },
    { data: pillarPerformance },
    { data: mixRow },
    { data: historyRow },
    { data: cenarioRow },
  ] = await Promise.all([
    supabaseAdmin.from("alude_mix_balance").select("*"),
    supabaseAdmin.from("alude_mix_performance").select("*"),
    supabaseAdmin.from("alude_pillar_balance").select("*"),
    supabaseAdmin.from("alude_pillar_performance").select("*"),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "mix_weights").single(),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "mix_weights_history").single(),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "cenario_weights").single(),
  ]);

  const mixWeights = (mixRow?.value as Record<string, number>) ?? {};
  const history =
    (historyRow?.value as Array<{ at: string; weights: Record<string, number>; motivo: string | null }>) ?? [];
  const cenarioWeights = (cenarioRow?.value as Record<string, number>) ?? {};

  // ordena o balanço na ordem canônica dos 8 tipos, não na ordem que o banco devolve
  const balanceByType = new Map((mixBalance ?? []).map((row) => [row.content_type, row]));

  return (
    <div className="space-y-10">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Performance</p>
        <h1 className="display text-3xl text-areia">O que está funcionando</h1>
      </div>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Mix por tipo (28 dias)</h2>
        <p className="text-sm text-areia/50 mb-3">
          Content_type é a dimensão que o mix pesa: função psicológica da peça, agrupada nos 4 quadrantes da
          matriz (Entreter, Inspirar, Curadoria, Convocar).
        </p>
        <div className="rounded-xl border border-areia/10 bg-breu/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-areia/40 text-xs uppercase">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Produzido</th>
                <th className="px-4 py-3">Publicado</th>
                <th className="px-4 py-3">Peso alvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-areia/10">
              {CONTENT_TYPES.map((type) => {
                const row = balanceByType.get(type);
                return (
                  <tr key={type}>
                    <td className="px-4 py-3 text-areia">{CONTENT_TYPE_LABELS[type] ?? type}</td>
                    <td className="px-4 py-3 text-areia/70">{row?.produzido_28d ?? 0}</td>
                    <td className="px-4 py-3 text-areia/70">{row?.publicado_28d ?? 0}</td>
                    <td className="px-4 py-3 text-dourado">{row?.peso_alvo ?? mixWeights[type] ?? 0}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Alcance por tipo e formato (28 dias)</h2>
        {mixPerformance && mixPerformance.length > 0 ? (
          <div className="rounded-xl border border-areia/10 bg-breu/60 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-areia/40 text-xs uppercase">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Formato</th>
                  <th className="px-4 py-3">Rede</th>
                  <th className="px-4 py-3">Publicações</th>
                  <th className="px-4 py-3">Alcance mediano</th>
                  <th className="px-4 py-3">Comentários mediano</th>
                  <th className="px-4 py-3">Saves / alcance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-areia/10">
                {mixPerformance.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-areia">{CONTENT_TYPE_LABELS[row.content_type] ?? row.content_type}</td>
                    <td className="px-4 py-3 text-areia/70">{FORMAT_LABELS[row.format] ?? row.format}</td>
                    <td className="px-4 py-3 text-areia/70">{PLATFORM_LABELS[row.platform] ?? row.platform}</td>
                    <td className="px-4 py-3 text-areia/70">{row.pubs_28d}</td>
                    <td className="px-4 py-3 text-dourado">{fmtReach(row.reach_mediana)}</td>
                    <td className="px-4 py-3 text-dourado">{fmtReach(row.comments_mediana)}</td>
                    <td className="px-4 py-3 text-dourado">{fmtSavesPorReach(row.saves_por_reach_mediana)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-areia/40 italic">
            Nada publicado ainda; as métricas nascem D+2 após a primeira publicação.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Mix de tipos</h2>
        <MixWeightsEditor initialWeights={mixWeights} history={history} />
      </section>

      <details className="rounded-xl border border-areia/10 bg-breu/40">
        <summary className="cursor-pointer px-5 py-4 text-sm text-areia/60 uppercase tracking-wide">
          Leitura por cenário (lente secundária)
        </summary>
        <div className="px-5 pb-5 space-y-8">
          <p className="text-sm text-areia/50">
            Cenário é o que aparece na peça (pov_cabine, recap, comunidade...). Não é o que o mix pesa; é uma
            leitura complementar pra ver se um cenário funciona melhor com um tipo do que com outro.
          </p>

          <div>
            <h3 className="text-xs text-areia/50 uppercase tracking-wide mb-3">Balanço de cenários (28 dias)</h3>
            <div className="rounded-xl border border-areia/10 bg-breu/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-areia/40 text-xs uppercase">
                    <th className="px-4 py-3">Cenário</th>
                    <th className="px-4 py-3">Produzido</th>
                    <th className="px-4 py-3">Publicado</th>
                    <th className="px-4 py-3">Peso de referência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-areia/10">
                  {(pillarBalance ?? []).map((row) => (
                    <tr key={row.pillar}>
                      <td className="px-4 py-3 text-areia">{PILLAR_LABELS[row.pillar] ?? row.pillar}</td>
                      <td className="px-4 py-3 text-areia/70">{row.produzido_28d}</td>
                      <td className="px-4 py-3 text-areia/70">{row.publicado_28d}</td>
                      <td className="px-4 py-3 text-areia/60">{cenarioWeights[row.pillar] ?? row.peso_alvo}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs text-areia/50 uppercase tracking-wide mb-3">
              Alcance por cenário e formato (28 dias)
            </h3>
            {pillarPerformance && pillarPerformance.length > 0 ? (
              <div className="rounded-xl border border-areia/10 bg-breu/60 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-areia/40 text-xs uppercase">
                      <th className="px-4 py-3">Cenário</th>
                      <th className="px-4 py-3">Formato</th>
                      <th className="px-4 py-3">Rede</th>
                      <th className="px-4 py-3">Publicações</th>
                      <th className="px-4 py-3">Alcance mediano</th>
                      <th className="px-4 py-3">Saves / alcance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-areia/10">
                    {pillarPerformance.map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-areia">{PILLAR_LABELS[row.pillar] ?? row.pillar}</td>
                        <td className="px-4 py-3 text-areia/70">{FORMAT_LABELS[row.format] ?? row.format}</td>
                        <td className="px-4 py-3 text-areia/70">{PLATFORM_LABELS[row.platform] ?? row.platform}</td>
                        <td className="px-4 py-3 text-areia/70">{row.pubs_28d}</td>
                        <td className="px-4 py-3 text-dourado">{fmtReach(row.reach_mediana)}</td>
                        <td className="px-4 py-3 text-dourado">{fmtSavesPorReach(row.saves_por_reach_mediana)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-areia/40 italic">
                Nada publicado ainda; as métricas nascem D+2 após a primeira publicação.
              </p>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
