/**
 * Gate do /admin: sessão do Supabase Auth nos cookies e e-mail em ADMIN_EMAILS.
 * /admin/login e /admin/auth/* ficam de fora (senão vira loop). Edge: sem node:crypto.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function ehAdmin(email: string | null | undefined): boolean {
  const lista = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!email && lista.includes(email.trim().toLowerCase());
}

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const login = new URL("/admin/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname);
  if (!url || !key) return NextResponse.redirect(login);

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of lista) res.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await sb.auth.getUser();
  if (data.user && ehAdmin(data.user.email)) return res;
  if (data.user) login.searchParams.set("erro", "sem-acesso");
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/((?!login|auth/).*)"],
};
