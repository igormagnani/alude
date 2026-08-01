import { NextResponse } from "next/server";
import { authorizeBearer } from "@/lib/secure-compare";
import { supabaseAdmin } from "@/lib/supabase";
import { getIgAuth, IG_GRAPH_BASE } from "@/lib/ig-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 280;

function authed(req: Request): boolean {
  return authorizeBearer(req, process.env.CRON_SECRET);
}

const IG_METRICS = ["reach", "likes", "comments", "saved", "shares", "plays"];

/**
 * Busca insights tolerando métrica indisponível pro tipo de mídia (o Graph
 * API rejeita a chamada inteira se qualquer métrica pedida não existir pra
 * aquele media_type). Tenta tudo de uma vez; se falhar, tenta uma por uma
 * e mantém só as que funcionaram.
 */
async function fetchInstagramInsights(mediaId: string, token: string): Promise<Record<string, number>> {
  const base = `${IG_GRAPH_BASE}/${mediaId}/insights`;
  const tryFetch = async (metrics: string[]) => {
    const url = `${base}?metric=${metrics.join(",")}&access_token=${token}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json;
  };

  try {
    const json = await tryFetch(IG_METRICS);
    const out: Record<string, number> = {};
    for (const entry of json.data ?? []) out[entry.name] = entry.values?.[0]?.value ?? 0;
    return out;
  } catch {
    const out: Record<string, number> = {};
    for (const metric of IG_METRICS) {
      try {
        const json = await tryFetch([metric]);
        const val = json.data?.[0]?.values?.[0]?.value;
        if (typeof val === "number") out[metric] = val;
      } catch {
        // métrica indisponível pra esse tipo de mídia, segue sem ela
      }
    }
    return out;
  }
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = Date.now();
  const from = new Date(now - 8 * 86400000).toISOString();
  const to = new Date(now - 1 * 86400000).toISOString();

  const { data: pubs, error } = await supabaseAdmin
    .from("alude_publications")
    .select("*")
    .eq("status", "published")
    .gte("published_at", from)
    .lte("published_at", to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const igAuth = await getIgAuth();
  const igReady = Boolean(igAuth);

  let fetched = 0;
  let skipped = 0;

  for (const pub of pubs ?? []) {
    if (pub.platform !== "instagram" || !pub.external_id) {
      skipped += 1;
      continue;
    }
    if (!igAuth) {
      skipped += 1;
      continue;
    }
    try {
      const insights = await fetchInstagramInsights(pub.external_id, igAuth.token);
      const prevMetrics = (pub.metrics ?? {}) as { fetched?: unknown[] };
      const fetchedLog = Array.isArray(prevMetrics.fetched) ? prevMetrics.fetched : [];
      fetchedLog.push({ at: new Date().toISOString(), day: new Date().toISOString().slice(0, 10) });
      const mergedMetrics = { ...prevMetrics, ...insights, fetched: fetchedLog };

      await supabaseAdmin
        .from("alude_publications")
        .update({ metrics: mergedMetrics, metrics_fetched_at: new Date().toISOString() })
        .eq("id", pub.id);
      fetched += 1;
    } catch {
      skipped += 1;
    }
  }

  return NextResponse.json({ ok: true, candidates: pubs?.length ?? 0, fetched, skipped, ig_ready: igReady });
}

export const POST = GET;
