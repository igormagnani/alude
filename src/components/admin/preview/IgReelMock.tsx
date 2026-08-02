"use client";

import { useRef, useState } from "react";
import type { SVGProps } from "react";
import {
  EmptyMediaPlaceholder,
  IconComment,
  IconHeart,
  IconMore,
  IconShare,
  IG_AVATAR_SRC,
  IG_HANDLE,
  truncateCaption,
  type PreviewItem,
} from "./shared";

/**
 * Mock de reel/short/vídeo longo: moldura 9:16, vídeo real tocando mudo em
 * loop (igual ao feed do app), tap pausa. Rail direito com os mesmos ícones
 * do feed (menos o bookmark, que no reel real também some) + disco de áudio
 * girando devagar por cima da capa.
 */
export function IgReelMock({ item }: { item: PreviewItem }) {
  const media = item.asset?.media;
  const videoUrl = media?.video_url;
  const coverUrl = media?.cover_url ?? media?.image_url;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);

  const caption = item.caption ?? "";
  const { short, truncated } = truncateCaption(caption, 90);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-900">
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            autoPlay
            loop
            controls={false}
            onClick={toggle}
            className="h-full w-full object-cover"
          />
          {paused && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <IconPlay className="h-14 w-14 text-white/90" aria-hidden />
            </div>
          )}
        </>
      ) : (
        <EmptyMediaPlaceholder hook={item.hook} title={item.title} />
      )}

      {/* legibilidade do rail/legenda sobre o vídeo, igual ao IG real */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
        <span className="text-[13px] font-semibold text-white drop-shadow">Reels</span>
        <IconMore className="h-5 w-5 rotate-90 text-white" aria-hidden />
      </div>

      <div className="pointer-events-none absolute bottom-3 right-2.5 flex flex-col items-center gap-5 text-white">
        <IconHeart className="h-7 w-7 drop-shadow" aria-hidden />
        <IconComment className="h-7 w-7 drop-shadow" aria-hidden />
        <IconShare className="h-7 w-7 drop-shadow" aria-hidden />
        <div className="mt-1 h-8 w-8 overflow-hidden rounded-md ring-1 ring-white/40 reel-disc-spin motion-reduce:animate-none">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-noite" />
          )}
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-3 max-w-[75%] space-y-1.5">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IG_AVATAR_SRC} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/30" />
          <span className="text-[13px] font-semibold text-white drop-shadow">{IG_HANDLE}</span>
        </div>
        {caption && (
          <p className="text-[13px] leading-snug text-white drop-shadow">
            {captionOpen || !truncated ? caption : `${short}… `}
            {truncated && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCaptionOpen((v) => !v);
                }}
                className="font-semibold text-white/80"
              >
                {captionOpen ? "menos" : "mais"}
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function IconPlay(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
