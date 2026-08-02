import type { SVGProps } from "react";
import { PERFIS } from "@/lib/site";
import type { ContentAsset } from "@/lib/asset-types";

/**
 * Peças compartilhadas dos mocks de Instagram (Fase 1 da re-arquitetura do
 * admin, docs/plans/... "Preview IG"). Um único lugar pro shape do item, pro
 * @handle real e pros ícones de chrome do IG (evita duplicar entre
 * IgFeedMock/IgReelMock/IgStoryMock).
 */

export type PreviewItem = {
  id: string;
  pillar: string;
  content_type: string;
  format: string;
  title: string;
  hook: string | null;
  roteiro: string | null;
  caption: string | null;
  hashtags: string[] | null;
  platforms: string[];
  status: string;
  asset: ContentAsset;
  scheduled_at: string | null;
  rejection_note: string | null;
  topic: { title: string } | null;
};

export type PublicationLink = { platform: string; external_url: string | null };

/** @handle real, derivado da URL canônica em site.ts (nunca hardcoded solto). */
export const IG_HANDLE = new URL(PERFIS.instagram).pathname.replace(/\//g, "");

export const IG_AVATAR_SRC = "/brand/icon-cor.png";

/**
 * Trunca como o feed do IG faz (~125 chars), cortando em palavra inteira
 * quando dá. Usado tanto no feed (padrão 125) quanto no reel (2 linhas, menos
 * chars).
 */
export function truncateCaption(caption: string, max = 125): { short: string; truncated: boolean } {
  if (caption.length <= max) return { short: caption, truncated: false };
  const cut = caption.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const short = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return { short, truncated: true };
}

/**
 * Item sem mídia gerada ainda: placeholder na paleta da marca (não do IG),
 * porque aqui o conteúdo É a ausência de mídia. Hook (ou título, se não
 * houver hook) grande em Archivo pra ainda dar pra julgar a copy.
 */
export function EmptyMediaPlaceholder({ hook, title }: { hook: string | null; title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-noite to-breu px-6 text-center">
      <p className="display text-2xl text-areia sm:text-3xl">{hook || title}</p>
      <p className="text-[11px] uppercase tracking-[0.16em] text-areia/40">mídia ainda não gerada</p>
    </div>
  );
}

// ---------- Ícones de chrome do IG (outline, mesmo traço do resto do admin) ----------

export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 5 5.5 4.3 8 3.8 10 5 12 7.5 14 5 16 3.8 18.5 4.3 22 5 23.5 8.4 22 11.8 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function IconComment(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.5 9.3 9.3 0 0 1-3.1-.5L3 21l1.6-4.7A8.3 8.3 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
    </svg>
  );
}

export function IconShare(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 3 15 22l-3.5-7L4 11l18-8z" />
      <path d="M22 3 9.5 15" />
    </svg>
  );
}

export function IconBookmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function IconMore(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
