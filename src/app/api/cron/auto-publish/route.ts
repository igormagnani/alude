import { NextResponse } from "next/server";
import { authorizeBearer } from "@/lib/secure-compare";
import { supabaseAdmin } from "@/lib/supabase";
import { dispatchPublish, type ContentItemRow, type PublicationRow } from "@/lib/publishers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 280;

function authed(req: Request): boolean {
  return authorizeBearer(req, process.env.CRON_SECRET);
}

/**
 * Fase 1, enqueue: items aprovado + scheduled_at preenchido viram uma
 * `alude_publications` pending por plataforma (upsert idempotente por
 * item_id+platform) e o item passa a 'agendado'.
 */
async function enqueue(): Promise<{ scanned: number; enqueued: number }> {
  const { data: items } = await supabaseAdmin
    .from("alude_content_items")
    .select("id, platforms, scheduled_at")
    .eq("status", "aprovado")
    .not("scheduled_at", "is", null)
    .limit(200);

  let enqueued = 0;
  for (const item of items ?? []) {
    const platforms = (item.platforms ?? []) as string[];
    for (const platform of platforms) {
      const { error } = await supabaseAdmin.from("alude_publications").upsert(
        {
          item_id: item.id,
          platform,
          scheduled_at: item.scheduled_at,
          status: "pending",
        },
        { onConflict: "item_id,platform", ignoreDuplicates: true }
      );
      if (!error) enqueued += 1;
    }
    await supabaseAdmin
      .from("alude_content_items")
      .update({ status: "agendado", updated_at: new Date().toISOString() })
      .eq("id", item.id);
  }
  return { scanned: items?.length ?? 0, enqueued };
}

/**
 * Fase 2, publish: publications pending + scheduled_at no passado +
 * attempts<3. Chama dispatchPublish; awaiting_connection não conta como
 * tentativa. Quando todas as publications de um item terminam published,
 * o item vira 'publicado'.
 */
async function publish(): Promise<{ attempted: number; published: number; awaiting: number; failed: number }> {
  const now = new Date().toISOString();
  // awaiting_connection volta pra avaliação a cada run: quando a plataforma
  // for conectada (envs presentes), a publicação sai sozinha sem intervenção.
  const { data: pending } = await supabaseAdmin
    .from("alude_publications")
    .select("*")
    .in("status", ["pending", "awaiting_connection"])
    .lte("scheduled_at", now)
    .lt("publisher_attempts", 3)
    .limit(20);

  let published = 0;
  let awaiting = 0;
  let failed = 0;
  const touchedItems = new Set<string>();

  for (const pub of (pending ?? []) as PublicationRow[]) {
    const { data: item } = await supabaseAdmin
      .from("alude_content_items")
      .select("*")
      .eq("id", pub.item_id)
      .single();
    if (!item) continue;

    try {
      const result = await dispatchPublish(pub, item as ContentItemRow);
      if (result.status === "awaiting_connection") {
        await supabaseAdmin.from("alude_publications").update({ status: "awaiting_connection" }).eq("id", pub.id);
        awaiting += 1;
        continue;
      }
      await supabaseAdmin
        .from("alude_publications")
        .update({
          status: "published",
          external_id: result.external_id,
          external_url: result.external_url,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", pub.id);
      published += 1;
      touchedItems.add(pub.item_id);
    } catch (e) {
      const attempts = pub.publisher_attempts + 1;
      await supabaseAdmin
        .from("alude_publications")
        .update({
          publisher_attempts: attempts,
          last_error: e instanceof Error ? e.message : String(e),
          status: attempts >= 3 ? "failed" : "pending",
        })
        .eq("id", pub.id);
      failed += 1;
    }
  }

  for (const itemId of touchedItems) {
    const { data: pubs } = await supabaseAdmin
      .from("alude_publications")
      .select("status")
      .eq("item_id", itemId);
    const allPublished = (pubs ?? []).length > 0 && (pubs ?? []).every((p) => p.status === "published");
    if (allPublished) {
      await supabaseAdmin
        .from("alude_content_items")
        .update({ status: "publicado", updated_at: new Date().toISOString() })
        .eq("id", itemId);
    }
  }

  return { attempted: pending?.length ?? 0, published, awaiting, failed };
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { data: settingRow } = await supabaseAdmin
      .from("alude_settings")
      .select("value")
      .eq("key", "producao_ligada")
      .single();
    if (settingRow?.value !== true) {
      return NextResponse.json({ ok: true, paused: true });
    }
    const enqueueResult = await enqueue();
    const publishResult = await publish();
    return NextResponse.json({ ok: true, enqueue: enqueueResult, publish: publishResult });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const POST = GET;
