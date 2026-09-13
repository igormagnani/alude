import { NextResponse } from "next/server";
import { getAdminUser, supabaseServer } from "@/lib/supabase-ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { password }: define a senha da conta logada (depois do link de recuperação, ou quando quiser trocar). */
export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const senha = body?.password ?? "";
  if (senha.length < 8) return NextResponse.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: senha });
  if (error) return NextResponse.json({ error: "Não deu pra salvar a senha agora." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
