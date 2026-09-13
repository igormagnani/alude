import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Auth do admin da Alude (mesmo projeto Supabase que já guarda as
 * tabelas alude_*). Sessão em cookies do @supabase/ssr; só entra e-mail que
 * está em ADMIN_EMAILS. Igual ao admin da Hello Human e do Seu Nicho.
 */
function urlEChave() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios no env.");
  return { url, key };
}

export async function supabaseServer() {
  const { url, key } = urlEChave();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) store.set(name, value, options);
        } catch {
          /* RSC só lê; a rota que criou a sessão já gravou os cookies */
        }
      },
    },
  });
}

export function emailsAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function ehAdmin(email: string | null | undefined): boolean {
  return !!email && emailsAdmin().includes(email.trim().toLowerCase());
}

/** Usuário logado que está na lista de admins; senão null. */
export async function getAdminUser(): Promise<{ id: string; email: string } | null> {
  try {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    const u = data.user;
    return u?.email && ehAdmin(u.email) ? { id: u.id, email: u.email } : null;
  } catch {
    return null;
  }
}
