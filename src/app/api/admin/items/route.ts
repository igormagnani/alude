import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const week = searchParams.get("week");

  let query = supabaseAdmin
    .from("alude_content_items")
    .select("*, topic:alude_topics(title)")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
    query = statuses.length > 1 ? query.in("status", statuses) : query.eq("status", statuses[0]);
  }
  if (week) query = query.eq("week_of", week);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}
