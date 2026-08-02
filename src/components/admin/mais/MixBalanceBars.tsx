import { CONTENT_TYPE_LABELS, CONTENT_TYPE_QUADRANTS } from "@/lib/content-constants";

type BalanceRow = {
  content_type: string;
  produzido_28d: number;
  publicado_28d: number;
  peso_alvo: number | null;
};

/**
 * Mix vs alvo em barras horizontais (substitui a tabela de Performance).
 * Duas leituras por tipo — produzido e publicado, cada um como fatia do
 * respectivo total de 28 dias — com um traço marcando onde o peso_alvo cairia
 * na mesma escala. Sem dado ainda (T0): tudo em zero, o traço do alvo
 * continua visível pra já mostrar a meta.
 */
export function MixBalanceBars({ rows }: { rows: BalanceRow[] }) {
  const byType = new Map(rows.map((r) => [r.content_type, r]));
  const totalProduzido = rows.reduce((acc, r) => acc + (r.produzido_28d ?? 0), 0);
  const totalPublicado = rows.reduce((acc, r) => acc + (r.publicado_28d ?? 0), 0);

  const allValues = rows.flatMap((r) => [
    r.peso_alvo ?? 0,
    totalProduzido > 0 ? (r.produzido_28d / totalProduzido) * 100 : 0,
    totalPublicado > 0 ? (r.publicado_28d / totalPublicado) * 100 : 0,
  ]);
  const scaleMax = Math.max(40, ...allValues);

  return (
    <div className="space-y-6">
      {CONTENT_TYPE_QUADRANTS.map((q) => (
        <div key={q.key}>
          <h3 className="mb-3 text-xs uppercase tracking-wide text-areia/50">{q.label}</h3>
          <div className="space-y-3">
            {q.types.map((type) => {
              const row = byType.get(type);
              const alvo = row?.peso_alvo ?? 0;
              const produzido = row?.produzido_28d ?? 0;
              const publicado = row?.publicado_28d ?? 0;
              const shareProduzido = totalProduzido > 0 ? (produzido / totalProduzido) * 100 : 0;
              const sharePublicado = totalPublicado > 0 ? (publicado / totalPublicado) * 100 : 0;
              return (
                <div key={type}>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="text-areia/80">{CONTENT_TYPE_LABELS[type] ?? type}</span>
                    <span className="text-areia/40">alvo {alvo}%</span>
                  </div>
                  <div className="space-y-1">
                    <MixBar label="produzido" value={produzido} share={shareProduzido} markerPct={alvo} scaleMax={scaleMax} tone="ambar" />
                    <MixBar label="publicado" value={publicado} share={sharePublicado} markerPct={alvo} scaleMax={scaleMax} tone="dourado" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MixBar({
  label,
  value,
  share,
  markerPct,
  scaleMax,
  tone,
}: {
  label: string;
  value: number;
  share: number;
  markerPct: number;
  scaleMax: number;
  tone: "ambar" | "dourado";
}) {
  const width = Math.min(100, (share / scaleMax) * 100);
  const marker = Math.min(100, (markerPct / scaleMax) * 100);
  const barColor = tone === "ambar" ? "bg-ambar/70" : "bg-dourado/70";
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-areia/35">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-areia/10">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
        <span className="absolute top-[-3px] bottom-[-3px] w-px bg-areia/50" style={{ left: `${marker}%` }} aria-hidden />
      </div>
      <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-areia/50">{value}</span>
    </div>
  );
}
