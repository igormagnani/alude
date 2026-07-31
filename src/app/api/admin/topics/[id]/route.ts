import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = ["title", "angle", "notes", "pillar", "score"] as const;

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/topics/[id]">) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "action obrigatória" }, { status: 400 });

  if (body.action === "approve") {
    const { error } = await supabaseAdmin
      .from("alude_topics")
      .update({ status: "aprovado", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "discard") {
    const { error } = await supabaseAdmin
      .from("alude_topics")
      .update({ status: "descartado", updated_at: new Date().toISOString() })
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
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "nenhum campo editável enviado." }, { status: 400 });
    }
    patch.updated_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("alude_topics").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inválida" }, { status: 400 });
}
