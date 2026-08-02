import Link from "next/link";
import { getAssetThumbnail, type ContentAsset } from "@/lib/asset-types";
import { EmptyState } from "@/components/admin/ui";

export type PrecisaDeVoceItem = {
  id: string;
  title: string;
  scheduled_at: string | null;
  asset: ContentAsset;
};

function shortWhen(iso: string | null): string {
  if (!iso) return "sem horário";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Strip horizontal de tudo em draft/em_revisao: toque abre o Preview direto
 * (triagem contínua, sem passar pela lista). Cartão w-32 fixo pra caber
 * vários na tela sem precisar de scroll vertical extra.
 */
export function PrecisaDeVoce({ items }: { items: PrecisaDeVoceItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="Nada esperando você" description="A fila de revisão está limpa." />;
  }

  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
      {items.map((item) => {
        const thumb = getAssetThumbnail(item.asset);
        return (
          <Link key={item.id} href={`/admin/p/${item.id}`} className="w-32 shrink-0 snap-start">
            <span className="block aspect-[4/5] w-full overflow-hidden rounded-lg bg-breu">
              {thumb ? (
                thumb.kind === "video" ? (
                  <video src={thumb.url} muted preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )
              ) : (
                <span className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-wide text-areia/30">
                  sem mídia
                </span>
              )}
            </span>
            <p className="mt-1.5 text-[11px] text-ambar">{shortWhen(item.scheduled_at)}</p>
            <p className="line-clamp-2 text-xs leading-snug text-areia/80">{item.title}</p>
          </Link>
        );
      })}
    </div>
  );
}
