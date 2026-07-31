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
  action: "edit" | "approve" | "reject" | "schedule" | "archive";
  fields?: Record<string, unknown>;
  rejection_note?: string;
  scheduled_at?: string;
};

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
    if (item.status !== "aprovado") {
      return NextResponse.json({ error: "só dá pra agendar item com status aprovado." }, { status: 400 });
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
