import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.set("alude_admin", "", { path: "/", maxAge: 0 });
  return res;
}
