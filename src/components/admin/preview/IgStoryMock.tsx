"use client";

import { getAssetThumbnail } from "@/lib/asset-types";
import { EmptyMediaPlaceholder, IG_AVATAR_SRC, IG_HANDLE, type PreviewItem } from "./shared";

/**
 * Mock de story: barra de progresso segmentada no topo (um segmento cheio,
 * já que cada peça é um único frame de story), avatar + "agora", mídia
 * full-bleed 9:16. Sem rail de ícones nem legenda: story real não tem isso.
 */
export function IgStoryMock({ item }: { item: PreviewItem }) {
  const thumb = getAssetThumbnail(item.asset);

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-900">
      {thumb ? (
        thumb.kind === "video" ? (
          <video src={thumb.url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb.url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <EmptyMediaPlaceholder hook={item.hook} title={item.title} />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-2.5 pt-2.5">
        <div className="flex gap-1">
          <span className="h-0.5 flex-1 rounded-full bg-white" />
        </div>
        <div className="mt-2.5 flex items-center gap-2 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IG_AVATAR_SRC} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/40" />
          <span className="text-[13px] font-semibold text-white drop-shadow">{IG_HANDLE}</span>
          <span className="text-[13px] text-white/70 drop-shadow">agora</span>
        </div>
      </div>
    </div>
  );
}
