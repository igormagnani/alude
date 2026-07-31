import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [balance, performance, mixBalance, mixPerformance, settingsRows] = await Promise.all([
    supabaseAdmin.from("alude_pillar_balance").select("*"),
    supabaseAdmin.from("alude_pillar_performance").select("*"),
    supabaseAdmin.from("alude_mix_balance").select("*"),
    supabaseAdmin.from("alude_mix_performance").select("*"),
    supabaseAdmin
      .from("alude_settings")
      .select("*")
      .in("key", ["mix_weights", "mix_weights_history", "cenario_weights", "producao_ligada"]),
  ]);

  if (balance.error) return NextResponse.json({ error: balance.error.message }, { status: 500 });
  if (performance.error) return NextResponse.json({ error: performance.error.message }, { status: 500 });
  if (mixBalance.error) return NextResponse.json({ error: mixBalance.error.message }, { status: 500 });
  if (mixPerformance.error) return NextResponse.json({ error: mixPerformance.error.message }, { status: 500 });
  if (settingsRows.error) return NextResponse.json({ error: settingsRows.error.message }, { status: 500 });

  const settings: Record<string, unknown> = {};
  for (const row of settingsRows.data ?? []) settings[row.key] = row.value;

  return NextResponse.json({
    // leitura secundária por cenário (pillar); mantida pra compatibilidade
    balance: balance.data,
    performance: performance.data,
    // leitura principal por content_type (o que o mix pesa)
    mix_balance: mixBalance.data,
    mix_performance: mixPerformance.data,
    settings: {
      mix_weights: settings.mix_weights ?? null,
      mix_weights_history: settings.mix_weights_history ?? [],
      // cenario_weights é somente leitura: referência histórica, não editável no /admin
      cenario_weights: settings.cenario_weights ?? null,
      producao_ligada: settings.producao_ligada ?? false,
    },
  });
}
