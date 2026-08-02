import Link from "next/link";
import { PLATFORM_LABELS } from "@/lib/content-constants";
import { EmptyState } from "@/components/admin/ui";

export type RankedPublication = {
  id: string;
  platform: string;
  metrics: { reach?: number } | null;
  item: { id: string; title: string } | null;
};

/**
 * Top3/bottom3 por alcance (só entre publicações já com métrica). Estado
 * vazio honesto quando ninguém tem `metrics.reach` ainda — nada de gráfico
 * fingindo dado que não existe.
 */
export function MelhoresPiores({ top3, bottom3 }: { top3: RankedPublication[]; bottom3: RankedPublication[] }) {
  if (top3.length === 0) {
    return (
      <EmptyState
        title="Ainda sem base pra comparar"
        description="As primeiras publicações precisam de alcance registrado (D+2) pra aparecer aqui."
      />
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <RankList title="Melhores por alcance" rows={top3} tone="dourado" />
      {bottom3.length > 0 && <RankList title="Piores por alcance" rows={bottom3} tone="brasa" />}
    </div>
  );
}

function RankList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: RankedPublication[];
  tone: "dourado" | "brasa";
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs uppercase tracking-wide text-areia/50">{title}</h3>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-lg border border-areia/10 bg-breu/60 px-3 py-2.5">
            <span className={`text-xs font-semibold tabular-nums ${tone === "dourado" ? "text-dourado" : "text-brasa"}`}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              {r.item ? (
                <Link
                  href={`/admin/p/${r.item.id}`}
                  className="block truncate text-sm text-areia transition-colors duration-150 hover:text-ambar"
                >
                  {r.item.title}
                </Link>
              ) : (
                <p className="truncate text-sm text-areia/50">peça removida</p>
              )}
              <p className="text-[11px] text-areia/40">{PLATFORM_LABELS[r.platform] ?? r.platform}</p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-areia/70">
              {(r.metrics?.reach ?? 0).toLocaleString("pt-BR")}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
