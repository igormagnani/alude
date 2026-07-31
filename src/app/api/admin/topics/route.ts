import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin.from("alude_topics").select("*").order("score", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topics: data });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("alude_topics")
    .insert({
      source: "igor",
      title: body.title,
      angle: body.angle ?? null,
      notes: body.notes ?? null,
      pillar: body.pillar ?? null,
      score: body.score ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data }, { status: 201 });
}
