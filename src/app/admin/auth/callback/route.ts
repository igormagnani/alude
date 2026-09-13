import { NextResponse, type NextRequest } from "next/server";
import { ehAdmin, supabaseServer } from "@/lib/supabase-ssr";

export const dynamic = "force-dynamic";

/** Volta do link do Supabase (PKCE `code` ou `token_hash`): grava a sessão e segue pro admin. */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const next = searchParams.get("next");
  const destino = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  const erro = (m: string) => NextResponse.redirect(`${origin}/admin/login?erro=${encodeURIComponent(m)}`);
  const sb = await supabaseServer();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return erro("link");
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ type: type as "magiclink" | "email" | "recovery", token_hash: tokenHash });
    if (error) return erro("link");
  } else {
    return erro("link");
  }
  const { data } = await sb.auth.getUser();
  if (!ehAdmin(data.user?.email)) {
    await sb.auth.signOut();
    return erro("sem-acesso");
  }
  return NextResponse.redirect(`${origin}${destino}`);
}
