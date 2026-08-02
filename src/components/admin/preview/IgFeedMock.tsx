"use client";

import { useState } from "react";
import { getAssetThumbnail } from "@/lib/asset-types";
import {
  EmptyMediaPlaceholder,
  IconBookmark,
  IconHeart,
  IconComment,
  IconMore,
  IconShare,
  IG_AVATAR_SRC,
  IG_HANDLE,
  truncateCaption,
  type PreviewItem,
} from "./shared";

/**
 * Mock de feed do IG (foto/carrossel/atualização de playlist): a arte é 4:5
 * por padrão (o corte real do feed), com opção 3:2 quando o primeiro prompt
 * de mídia já pede paisagem. Chrome fiel ao IG real (preto, branco, cinza) —
 * a marca só aparece dentro da mídia e da legenda, nunca no chrome.
 */
export function IgFeedMock({ item }: { item: PreviewItem }) {
  const media = item.asset?.media;
  const slides = media?.kind === "carousel" ? (media.carousel_slides ?? []) : [];
  const isCarousel = item.format === "carrossel" && slides.length > 0;
  const aspect = item.asset?.prompts?.[0]?.aspect_ratio === "3:2" ? "aspect-[3/2]" : "aspect-[4/5]";
  const thumb = getAssetThumbnail(item.asset);

  const [slide, setSlide] = useState(0);
  const [captionOpen, setCaptionOpen] = useState(false);

  const caption = item.caption ?? "";
  const { short, truncated } = truncateCaption(caption);

  return (
    <article className="border-b border-white/10 bg-black pb-3">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IG_AVATAR_SRC} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/15" />
        <span className="flex-1 truncate text-[13px] font-semibold text-white">{IG_HANDLE}</span>
        <IconMore className="h-[18px] w-[18px] text-white/70" aria-hidden />
      </header>

      <div className={`relative w-full overflow-hidden bg-neutral-900 ${aspect}`}>
        {isCarousel ? (
          <>
            <div
              className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.clientWidth === 0) return;
                setSlide(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {slides.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={s.url} alt={s.alt ?? ""} className="h-full w-full shrink-0 snap-center object-cover" />
              ))}
            </div>
            {slides.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
                {slides.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
                      i === slide ? "bg-white" : "bg-white/35"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : thumb ? (
          thumb.kind === "video" ? (
            <video src={thumb.url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb.url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <EmptyMediaPlaceholder hook={item.hook} title={item.title} />
        )}
      </div>

      <div className="flex items-center gap-4 px-3 pt-2.5 text-white">
        <IconHeart className="h-6 w-6" aria-hidden />
        <IconComment className="h-6 w-6" aria-hidden />
        <IconShare className="h-6 w-6" aria-hidden />
        <IconBookmark className="ml-auto h-6 w-6" aria-hidden />
      </div>

      {caption && (
        <p className="px-3 pt-2 text-[13px] leading-snug text-white">
          <span className="font-semibold">{IG_HANDLE}</span> {captionOpen || !truncated ? caption : `${short}… `}
          {truncated && (
            <button
              type="button"
              onClick={() => setCaptionOpen((v) => !v)}
              className="text-white/50 transition-colors duration-150 hover:text-white/80"
            >
              {captionOpen ? "menos" : "mais"}
            </button>
          )}
        </p>
      )}

      {item.hashtags && item.hashtags.length > 0 && (
        <p className="px-3 pt-1 text-[13px] leading-snug text-[#5ab8ff]">{item.hashtags.join(" ")}</p>
      )}
    </article>
  );
}
