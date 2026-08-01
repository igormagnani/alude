import "server-only";
import { getIgAuth, IG_GRAPH_BASE } from "@/lib/ig-auth";

/**
 * Publishers · máquina de conteúdo do Alude.
 *
 * Cada publisher recebe a linha de `alude_publications` (pub) e a linha de
 * `alude_content_items` (item) e retorna um PublishOutcome. Plataforma sem
 * credencial configurada retorna `awaiting_connection` (não é erro: o
 * dispatcher não incrementa `publisher_attempts` nesse caso).
 *
 * Convenção de asset: `item.asset.refs` é a lista de URLs públicas da mídia
 * já renderizada (1 item pra reel/foto/story, 2+ pra carrossel). Decisão
 * tomada aqui porque a migration só define o shape solto
 * `{refs:[], prompts:[], standby}`, ver relatório final.
 */

export type Platform = "instagram" | "tiktok" | "youtube" | "youtube-shorts" | "spotify";

export type PublicationRow = {
  id: string;
  item_id: string;
  platform: Platform;
  scheduled_at: string;
  publisher_attempts: number;
};

export type ContentItemRow = {
  id: string;
  format: string;
  caption: string | null;
  hashtags: string[] | null;
  asset: { refs?: string[]; prompts?: string[]; standby?: string | null } | null;
};

export type PublishOutcome =
  | { status: "published"; external_id: string; external_url: string }
  | { status: "awaiting_connection" };

export interface Publisher {
  platform: Platform;
  publish(pub: PublicationRow, item: ContentItemRow): Promise<PublishOutcome>;
}

const IG_POLL_TIMEOUT_MS = 90_000;
const IG_POLL_INTERVAL_MS = 3_000;

function buildCaption(item: ContentItemRow): string {
  const base = (item.caption ?? "").trim();
  const hashtags = (item.hashtags ?? []).filter((h) => h.length > 0);
  const withTags = hashtags.length ? `${base}\n\n${hashtags.join(" ")}` : base;
  return withTags.slice(0, 2200);
}

async function igFetch(
  path: string,
  params: Record<string, string>,
  token: string,
  method: "GET" | "POST" = "POST"
) {
  const url = new URL(`${IG_GRAPH_BASE}${path}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("access_token", token);
    const res = await fetch(url.toString(), { method: "GET" });
    const json = await res.json();
    if (!res.ok) throw new Error(`Instagram Graph GET ${path}: ${JSON.stringify(json)}`);
    return json;
  }
  const res = await fetch(url.toString(), { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(`Instagram Graph POST ${path}: ${JSON.stringify(json)}`);
  return json;
}

async function pollContainerFinished(containerId: string, token: string): Promise<void> {
  const deadline = Date.now() + IG_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await igFetch(`/${containerId}`, { fields: "status_code" }, token, "GET");
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error(`Instagram container ${containerId} falhou no processamento`);
    }
    await new Promise((r) => setTimeout(r, IG_POLL_INTERVAL_MS));
  }
  throw new Error(`Instagram container ${containerId} não terminou de processar a tempo`);
}

async function instagramPublish(pub: PublicationRow, item: ContentItemRow): Promise<PublishOutcome> {
  const auth = await getIgAuth();
  if (!auth) return { status: "awaiting_connection" };
  const igUserId = auth.user_id;
  const token = auth.token;

  const refs = item.asset?.refs ?? [];
  const caption = buildCaption(item);
  const format = item.format;

  let containerId: string;

  if (format === "carrossel") {
    if (refs.length < 2) throw new Error("Instagram carrossel exige item.asset.refs com 2+ URLs");
    const childIds: string[] = [];
    for (const ref of refs.slice(0, 10)) {
      const isVideo = /\.(mp4|mov)(\?|$)/i.test(ref);
      const child = await igFetch(
        `/${igUserId}/media`,
        {
          is_carousel_item: "true",
          ...(isVideo ? { media_type: "VIDEO", video_url: ref } : { image_url: ref }),
        },
        token
      );
      childIds.push(child.id);
    }
    const parent = await igFetch(
      `/${igUserId}/media`,
      { media_type: "CAROUSEL", children: childIds.join(","), caption },
      token
    );
    containerId = parent.id;
    await pollContainerFinished(containerId, token);
  } else {
    const mediaUrl = refs[0];
    if (!mediaUrl) throw new Error(`Instagram ${format}: item.asset.refs vazio, sem mídia pra publicar`);

    if (format === "reel" || format === "short" || format === "video_longo") {
      const created = await igFetch(
        `/${igUserId}/media`,
        { media_type: "REELS", video_url: mediaUrl, caption, share_to_feed: "true" },
        token
      );
      containerId = created.id;
      await pollContainerFinished(containerId, token);
    } else if (format === "story") {
      const isVideo = /\.(mp4|mov)(\?|$)/i.test(mediaUrl);
      const created = await igFetch(
        `/${igUserId}/media`,
        { media_type: "STORIES", ...(isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl }) },
        token
      );
      containerId = created.id;
    } else {
      const created = await igFetch(`/${igUserId}/media`, { image_url: mediaUrl, caption }, token);
      containerId = created.id;
    }
    // Imagem também precisa do poll: publicar antes do container ficar FINISHED
    // dá erro 9007 "Media ID is not available" (mesmo bug já corrigido na HH).
    await pollContainerFinished(containerId, token);
  }

  const published = await igFetch(`/${igUserId}/media_publish`, { creation_id: containerId }, token);
  const mediaId: string = published.id;

  let permalink = `https://www.instagram.com/reel/${mediaId}/`;
  try {
    const info = await igFetch(`/${mediaId}`, { fields: "permalink" }, token, "GET");
    if (info.permalink) permalink = info.permalink;
  } catch {
    // permalink é cosmético; segue com o fallback
  }

  return { status: "published", external_id: mediaId, external_url: permalink };
}

async function awaitingConnection(): Promise<PublishOutcome> {
  return { status: "awaiting_connection" };
}

const PUBLISHERS: Record<Platform, Publisher> = {
  instagram: { platform: "instagram", publish: instagramPublish },
  tiktok: { platform: "tiktok", publish: awaitingConnection },
  youtube: { platform: "youtube", publish: awaitingConnection },
  "youtube-shorts": { platform: "youtube-shorts", publish: awaitingConnection },
  spotify: { platform: "spotify", publish: awaitingConnection },
};

export async function dispatchPublish(pub: PublicationRow, item: ContentItemRow): Promise<PublishOutcome> {
  const publisher = PUBLISHERS[pub.platform];
  if (!publisher) throw new Error(`Plataforma desconhecida: ${pub.platform}`);
  return publisher.publish(pub, item);
}
