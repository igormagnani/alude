import { NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYMPLA_URL =
  "https://www.sympla.com.br/evento/sol-da-meia-noite/3548202?d=NICHO";

const VALID_ORIGINS = new Set(["bio", "story", "ads", "feed"]);

/**
 * Registra o clique em alude_settings (chave sol_clicks, jsonb
 * `{ "YYYY-MM-DD": { "bio": n, "story": n, ... } }`). Roda depois da resposta
 * (after()) e nunca pode atrasar nem bloquear o redirect: falha vira log mudo.
 */
async function registrarClique(origem: string) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: row } = await supabaseAdmin
      .from("alude_settings")
      .select("value")
      .eq("key", "sol_clicks")
      .single();
    const value = (row?.value as Record<string, Record<string, number>>) ?? {};
    const dia = { ...(value[hoje] ?? {}) };
    dia[origem] = (dia[origem] ?? 0) + 1;
    const novoValue = { ...value, [hoje]: dia };
    await supabaseAdmin
      .from("alude_settings")
      .upsert({ key: "sol_clicks", value: novoValue, updated_at: new Date().toISOString() });
  } catch (e) {
    console.error("[/sol] falha ao registrar clique (redirect não é afetado):", e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const oParam = searchParams.get("o") ?? "bio";
  const origem = VALID_ORIGINS.has(oParam) ? oParam : "bio";

  after(() => registrarClique(origem));

  const url = `${SYMPLA_URL}&utm_source=alude&utm_medium=${origem}&utm_campaign=sol14`;
  return NextResponse.redirect(url, 307);
}
