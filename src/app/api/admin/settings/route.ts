import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PILLAR_FLOOR = 5;
const PILLAR_CEIL = 35;
const PILLARS = ["pov_cabine", "recap", "comunidade", "curadoria", "day_in_the_life", "bastidor_estilo"];

function validateMixWeights(weights: unknown): string | null {
  if (!weights || typeof weights !== "object") return "mix_weights precisa ser um objeto.";
  const w = weights as Record<string, unknown>;
  let sum = 0;
  for (const pillar of PILLARS) {
    const v = w[pillar];
    if (typeof v !== "number") return `mix_weights.${pillar} precisa ser um número.`;
    if (v < PILLAR_FLOOR || v > PILLAR_CEIL) {
      return `mix_weights.${pillar} precisa ficar entre ${PILLAR_FLOOR} e ${PILLAR_CEIL}.`;
    }
    sum += v;
  }
  if (Math.abs(sum - 100) > 1) return `A soma dos pesos precisa ficar em 100 (está em ${sum}).`;
  return null;
}

function validateSlots(slots: unknown): string | null {
  if (!slots || typeof slots !== "object") return "slots precisa ser um objeto.";
  for (const [platform, list] of Object.entries(slots as Record<string, unknown>)) {
    if (!Array.isArray(list)) return `slots.${platform} precisa ser uma lista.`;
    for (const entry of list) {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof (entry as Record<string, unknown>).dia !== "string" ||
        typeof (entry as Record<string, unknown>).hora !== "string" ||
        typeof (entry as Record<string, unknown>).formato !== "string"
      ) {
        return `slots.${platform} tem uma entrada sem dia/hora/formato.`;
      }
    }
  }
  return null;
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("alude_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "corpo inválido" }, { status: 400 });

  const now = new Date().toISOString();

  if ("mix_weights" in body) {
    const err = validateMixWeights(body.mix_weights);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const { data: historyRow } = await supabaseAdmin
      .from("alude_settings")
      .select("value")
      .eq("key", "mix_weights_history")
      .single();
    const history = Array.isArray(historyRow?.value) ? historyRow.value : [];
    history.push({ at: now, weights: body.mix_weights, motivo: body.motivo ?? null });

    const { error: e1 } = await supabaseAdmin
      .from("alude_settings")
      .upsert({ key: "mix_weights", value: body.mix_weights, updated_at: now });
    const { error: e2 } = await supabaseAdmin
      .from("alude_settings")
      .upsert({ key: "mix_weights_history", value: history, updated_at: now });
    if (e1 || e2) return NextResponse.json({ error: (e1 ?? e2)!.message }, { status: 500 });
  }

  if ("producao_ligada" in body) {
    if (typeof body.producao_ligada !== "boolean") {
      return NextResponse.json({ error: "producao_ligada precisa ser boolean." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("alude_settings")
      .upsert({ key: "producao_ligada", value: body.producao_ligada, updated_at: now });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if ("slots" in body) {
    const err = validateSlots(body.slots);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("alude_settings")
      .upsert({ key: "slots", value: body.slots, updated_at: now });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
