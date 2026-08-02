import { getAssetThumbnail, type ContentAsset } from "@/lib/asset-types";
import { PLATFORM_LABELS } from "@/lib/content-constants";
import { EmptyState } from "@/components/admin/ui";

export type PublicadaItem = {
  id: string;
  platform: string;
  published_at: string | null;
  external_url: string | null;
  metrics: { reach?: number; saves?: number; fetched?: { at: string; day: number }[] } | null;
  item: { id: string; title: string; format: string; asset: ContentAsset } | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "sem data";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(
    new Date(iso)
  );
}

/**
 * Métricas só aparecem quando `metrics.fetched` já tem alguma coleta (D+2,
 * D+7...): o rótulo usa o dia da última coleta, nunca finge um número que
 * ainda não existe.
 */
export function PublicadasRecentes({ publications }: { publications: PublicadaItem[] }) {
  if (publications.length === 0) {
    return <EmptyState title="Nada publicado ainda" description="Assim que a primeira peça sair, ela aparece aqui." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {publications.map((pub) => {
        const thumb = pub.item ? getAssetThumbnail(pub.item.asset) : null;
        const fetched = pub.metrics?.fetched ?? [];
        const last = fetched[fetched.length - 1];
        return (
          <div key={pub.id} className="flex gap-3 rounded-xl border border-areia/10 bg-breu/60 p-3">
            <span className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-noite">
              {thumb ? (
                thumb.kind === "video" ? (
                  <video src={thumb.url} muted preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-areia">{pub.item?.title ?? "peça removida"}</p>
              <p className="mt-0.5 text-[11px] text-areia/40">
                {PLATFORM_LABELS[pub.platform] ?? pub.platform} · {fmtDate(pub.published_at)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                {last && pub.metrics?.reach != null && (
                  <span className="text-[11px] text-dourado">
                    D+{last.day} · {pub.metrics.reach.toLocaleString("pt-BR")} alcance
                  </span>
                )}
                {last && pub.metrics?.saves != null && (
                  <span className="text-[11px] text-areia/50">{pub.metrics.saves.toLocaleString("pt-BR")} saves</span>
                )}
                {pub.external_url && (
                  <a
                    href={pub.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-areia/50 transition-colors duration-150 hover:text-ambar"
                  >
                    ver ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
