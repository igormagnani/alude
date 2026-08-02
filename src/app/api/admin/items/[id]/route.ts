import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CONTENT_TYPES } from "@/lib/content-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "title",
  "hook",
  "roteiro",
  "caption",
  "hashtags",
  "platforms",
  "format",
  "pillar",
  "content_type",
  "scheduled_at",
  "asset",
] as const;

type Body = {
  action: "edit" | "approve" | "reject" | "schedule" | "archive" | "approve_and_schedule";
  fields?: Record<string, unknown>;
  rejection_note?: string;
  scheduled_at?: string;
};

/** Status de onde dá pra aprovar e agendar em 1 toque: qualquer estado que ainda não avançou no funil de publicação. */
const APPROVE_AND_SCHEDULE_FROM = ["draft", "em_revisao", "aprovado", "rejeitado"];

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/items/[id]">) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action) return NextResponse.json({ error: "action obrigatória" }, { status: 400 });

  const { data: item, error: fetchError } = await supabaseAdmin
    .from("alude_content_items")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !item) return NextResponse.json({ error: "item não encontrado" }, { status: 404 });

  if (body.action === "approve") {
    const { error } = await supabaseAdmin
      .from("alude_content_items")
      .update({ status: "aprovado", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve_and_schedule") {
    if (!APPROVE_AND_SCHEDULE_FROM.includes(item.status)) {
      return NextResponse.json(
        { error: `só dá pra aprovar e agendar a partir de: ${APPROVE_AND_SCHEDULE_FROM.join(", ")}.` },
        { status: 400 }
      );
    }
    const asset = (item.asset ?? {}) as { standby?: string | null };
    if (asset.standby === "depende-igor") {
      return NextResponse.json(
        { error: "Esse item depende de gravação/aprovação do Igor antes de agendar." },
        { status: 400 }
      );
    }
    if (!body.scheduled_at || new Date(body.scheduled_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "scheduled_at precisa ser uma data futura." }, { status: 400 });
    }
    // Aprova e propõe horário num só toque; o cron (api/cron/auto-publish) é
    // quem lê status='aprovado' + scheduled_at, enfileira em alude_publications
    // e SÓ ELE vira o status pra 'agendado'. A UI nunca seta 'agendado' direto.
    const { error } = await supabaseAdmin
      .from("alude_content_items")
      .update({
        status: "aprovado",
        scheduled_at: body.scheduled_at,
        rejection_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    if (!body.rejection_note?.trim()) {
      return NextResponse.json({ error: "rejection_note é obrigatória pra rejeitar." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("alude_content_items")
      .update({ status: "rejeitado", rejection_note: body.rejection_note, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "archive") {
    const { error } = await supabaseAdmin
      .from("alude_content_items")
      .update({ status: "arquivado", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "schedule") {
    if (item.status !== "aprovado" && item.status !== "agendado") {
      return NextResponse.json({ error: "só dá pra agendar item com status aprovado ou agendado." }, { status: 400 });
    }
    const asset = (item.asset ?? {}) as { standby?: string | null };
    if (asset.standby === "depende-igor") {
      return NextResponse.json(
        { error: "Esse item depende de gravação/aprovação do Igor antes de agendar." },
        { status: 400 }
      );
    }
    if (!body.scheduled_at || new Date(body.scheduled_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "scheduled_at precisa ser uma data futura." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("alude_content_items")
      .update({ scheduled_at: body.scheduled_at, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (item.status === "agendado") {
      // Reagendar um item que o cron já enfileirou: sem isso, as publications
      // pendentes ficariam com o scheduled_at velho e o cron publicaria na
      // hora errada assim que ela passasse (bug latente documentado no plano).
      const { error: pubError } = await supabaseAdmin
        .from("alude_publications")
        .update({ scheduled_at: body.scheduled_at })
        .eq("item_id", id)
        .in("status", ["pending", "awaiting_connection"]);
      if (pubError) return NextResponse.json({ error: pubError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "edit") {
    const fields = body.fields ?? {};
    const patch: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in fields) patch[key] = fields[key];
    }
    if ("content_type" in patch) {
      // content_type é NOT NULL no banco; barra aqui pra não estourar erro de constraint.
      if (typeof patch.content_type !== "string" || !CONTENT_TYPES.includes(patch.content_type)) {
        return NextResponse.json(
          { error: `content_type precisa ser um destes valores: ${CONTENT_TYPES.join(", ")}.` },
          { status: 400 }
        );
      }
    }
    if ("asset" in patch) {
      // Merge raso, não replace cego: preserva standby/refs/media quando o
      // caller manda só um pedaço do asset (ex: só `prompts` da Direção de mídia).
      const existingAsset = (item.asset && typeof item.asset === "object" ? item.asset : {}) as Record<
        string,
        unknown
      >;
      const incomingAsset = (patch.asset && typeof patch.asset === "object" ? patch.asset : {}) as Record<
        string,
        unknown
      >;
      patch.asset = { ...existingAsset, ...incomingAsset };
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "nenhum campo editável enviado." }, { status: 400 });
    }
    patch.updated_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("alude_content_items").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inválida" }, { status: 400 });
}
