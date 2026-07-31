import { supabaseAdmin } from "@/lib/supabase";
import { PILLAR_LABELS, FORMAT_LABELS, PLATFORM_LABELS } from "@/lib/content-constants";
import { MixWeightsEditor } from "@/components/admin/MixWeightsEditor";

export default async function PerformancePage() {
  const [{ data: balance }, { data: performance }, { data: mixRow }, { data: historyRow }] = await Promise.all([
    supabaseAdmin.from("alude_pillar_balance").select("*"),
    supabaseAdmin.from("alude_pillar_performance").select("*"),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "mix_weights").single(),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "mix_weights_history").single(),
  ]);

  const mixWeights = (mixRow?.value as Record<string, number>) ?? {};
  const history = (historyRow?.value as Array<{ at: string; weights: Record<string, number>; motivo: string | null }>) ?? [];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Performance</p>
        <h1 className="display text-3xl text-areia">O que está funcionando</h1>
      </div>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Balanço de pilares (28 dias)</h2>
        <div className="rounded-xl border border-areia/10 bg-breu/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-areia/40 text-xs uppercase">
                <th className="px-4 py-3">Pilar</th>
                <th className="px-4 py-3">Produzido</th>
                <th className="px-4 py-3">Publicado</th>
                <th className="px-4 py-3">Peso alvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-areia/10">
              {(balance ?? []).map((row) => (
                <tr key={row.pillar}>
                  <td className="px-4 py-3 text-areia">{PILLAR_LABELS[row.pillar] ?? row.pillar}</td>
                  <td className="px-4 py-3 text-areia/70">{row.produzido_28d}</td>
                  <td className="px-4 py-3 text-areia/70">{row.publicado_28d}</td>
                  <td className="px-4 py-3 text-dourado">{row.peso_alvo}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Alcance por pilar e formato (28 dias)</h2>
        {performance && performance.length > 0 ? (
          <div className="rounded-xl border border-areia/10 bg-breu/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-areia/40 text-xs uppercase">
                  <th className="px-4 py-3">Pilar</th>
                  <th className="px-4 py-3">Formato</th>
                  <th className="px-4 py-3">Rede</th>
                  <th className="px-4 py-3">Publicações</th>
                  <th className="px-4 py-3">Alcance mediano</th>
                  <th className="px-4 py-3">Saves / alcance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-areia/10">
                {performance.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-areia">{PILLAR_LABELS[row.pillar] ?? row.pillar}</td>
                    <td className="px-4 py-3 text-areia/70">{FORMAT_LABELS[row.format] ?? row.format}</td>
                    <td className="px-4 py-3 text-areia/70">{PLATFORM_LABELS[row.platform] ?? row.platform}</td>
                    <td className="px-4 py-3 text-areia/70">{row.pubs_28d}</td>
                    <td className="px-4 py-3 text-dourado">{Math.round(row.reach_mediana ?? 0)}</td>
                    <td className="px-4 py-3 text-dourado">
                      {row.saves_por_reach_mediana != null ? `${(row.saves_por_reach_mediana * 100).toFixed(1)}%` : "sem dado"}
                    </td>
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
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Mix de pilares</h2>
        <MixWeightsEditor initialWeights={mixWeights} history={history} />
      </section>
    </div>
  );
}
