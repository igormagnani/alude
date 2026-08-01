/**
 * Contrato do jsonb `alude_content_items.asset` (spec 2026-08-01, calendário padrão HH).
 * Sem migration: a coluna já existe, isto só tipa o shape esperado.
 * `refs` é lido por src/lib/publishers.ts (cron auto-publish) — não mexer no formato aqui.
 */

export type AssetPromptTool =
  | "seedance_2_5_ui"
  | "nano_banana_2"
  | "remotion"
  | "kling_edit"
  | "wan_2_5"
  | "dop_lite"
  | "photodump"
  | "seedream_4_5";

export const ASSET_PROMPT_TOOLS: AssetPromptTool[] = [
  "seedance_2_5_ui",
  "nano_banana_2",
  "remotion",
  "kling_edit",
  "wan_2_5",
  "dop_lite",
  "photodump",
  "seedream_4_5",
];

export type AssetPrompt = {
  label?: string;
  tool?: string;
  model?: string;
  prompt: string;
  aspect_ratio?: string;
  notes?: string;
};

export type AssetMediaKind = "image" | "video" | "carousel";

export type AssetCarouselSlide = {
  url: string;
  alt?: string;
};

export type AssetMedia = {
  kind: AssetMediaKind;
  image_url?: string;
  video_url?: string;
  cover_url?: string;
  carousel_slides?: AssetCarouselSlide[];
  generated_at?: string;
  tool?: string;
};

export type ContentAsset = {
  standby?: string | null;
  refs?: string[];
  prompts?: AssetPrompt[];
  media?: AssetMedia;
} | null;

export type AssetThumbnail = { kind: "image"; url: string } | { kind: "video"; url: string };

/**
 * cover_url → image_url → primeiro slide do carrossel → (fallback) video_url como <video>.
 * Retorna null quando não há nada pra mostrar (asset nulo/vazio continua funcionando).
 */
export function getAssetThumbnail(asset: ContentAsset): AssetThumbnail | null {
  const media = asset?.media;
  if (!media) return null;
  if (media.cover_url) return { kind: "image", url: media.cover_url };
  if (media.image_url) return { kind: "image", url: media.image_url };
  if (media.carousel_slides?.[0]?.url) return { kind: "image", url: media.carousel_slides[0].url };
  if (media.video_url) return { kind: "video", url: media.video_url };
  return null;
}

export function hasGeneratedMedia(asset: ContentAsset): boolean {
  const media = asset?.media;
  if (!media) return false;
  return Boolean(media.image_url || media.video_url || media.cover_url || media.carousel_slides?.length);
}

export function hasMediaPrompts(asset: ContentAsset): boolean {
  return Boolean(asset?.prompts?.length);
}
