import { NextResponse } from "next/server";
import { ehAdmin, supabaseServer } from "@/lib/supabase-ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login
 *  { email, password }        entra com senha (cookies de sessão).
 *  { email, link: true }      link mágico por e-mail (o Supabase manda).
 *  { email, recuperar: true } link pra criar senha nova (o Supabase manda).
 * Link e recuperação só saem pra e-mail da lista de admins; a resposta é igual
 * pra qualquer e-mail. Limite: 5 tentativas por IP a cada 15 min.
 */
const LIMITE = 5;
const JANELA_MS = 15 * 60_000;
const hits = new Map<string, { n: number; inicio: number }>();

function limitado(chave: string): boolean {
  const agora = Date.now();
  const h = hits.get(chave);
  if (!h || agora - h.inicio > JANELA_MS) {
    hits.set(chave, { n: 1, inicio: agora });
    return false;
  }
  h.n += 1;
  return h.n > LIMITE;
}

function proximo(next: unknown): string {
  return typeof next === "string" && /^\/admin(\/[a-z0-9\-/?=&]*)?$/i.test(next) && !next.startsWith("//") ? next : "/admin";
}

function origem(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://www.aludemusic.com";
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string; link?: boolean; recuperar?: boolean; next?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Confere o e-mail." }, { status: 400 });
  if (limitado(`ip:${ip}`)) return NextResponse.json({ error: "Muitas tentativas. Espera uns minutos e tenta de novo." }, { status: 429 });
  const next = proximo(body?.next);
  const sb = await supabaseServer();

  if (typeof body?.password === "string" && !body.link && !body.recuperar) {
    const { error } = await sb.auth.signInWithPassword({ email, password: body.password });
    if (error) return NextResponse.json({ error: "E-mail ou senha não batem. Se esqueceu a senha, pede um link." }, { status: 401 });
    return NextResponse.json({ ok: true, next });
  }

  // Link e recuperação: só pra quem é admin, sem revelar quem é.
  if (!ehAdmin(email)) return NextResponse.json({ ok: true });
  const callback = `${origem(req)}/admin/auth/callback?next=${encodeURIComponent(body?.recuperar ? "/admin/senha" : next)}`;
  const { error } = body?.recuperar
    ? await sb.auth.resetPasswordForEmail(email, { redirectTo: callback })
    : await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: callback, shouldCreateUser: false } });
  if (error) {
    console.error("[admin-login] envio falhou:", error.message);
    return NextResponse.json({ error: "Não deu pra mandar o e-mail agora. Tenta de novo em um minuto." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
