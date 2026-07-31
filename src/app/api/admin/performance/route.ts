import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [balance, performance, settingsRows] = await Promise.all([
    supabaseAdmin.from("alude_pillar_balance").select("*"),
    supabaseAdmin.from("alude_pillar_performance").select("*"),
    supabaseAdmin
      .from("alude_settings")
      .select("*")
      .in("key", ["mix_weights", "mix_weights_history", "producao_ligada"]),
  ]);

  if (balance.error) return NextResponse.json({ error: balance.error.message }, { status: 500 });
  if (performance.error) return NextResponse.json({ error: performance.error.message }, { status: 500 });
  if (settingsRows.error) return NextResponse.json({ error: settingsRows.error.message }, { status: 500 });

  const settings: Record<string, unknown> = {};
  for (const row of settingsRows.data ?? []) settings[row.key] = row.value;

  return NextResponse.json({
    balance: balance.data,
    performance: performance.data,
    settings: {
      mix_weights: settings.mix_weights ?? null,
      mix_weights_history: settings.mix_weights_history ?? [],
      producao_ligada: settings.producao_ligada ?? false,
    },
  });
}
