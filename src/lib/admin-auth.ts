import "server-only";
import { redirect } from "next/navigation";
import { safeEqual } from "./secure-compare";
import { getAdminUser } from "./supabase-ssr";

/**
 * Gate do admin: conta do Supabase Auth com e-mail em ADMIN_EMAILS. A antiga
 * chave ALUDE_ADMIN_KEY sobrevive só no header `x-alude-admin-key`, pra
 * script e CLI; não existe mais login por chave.
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const esperada = process.env.ALUDE_ADMIN_KEY;
  const header = req.headers.get("x-alude-admin-key");
  if (esperada && header && safeEqual(header, esperada)) return true;
  return !!(await getAdminUser());
}

/** Uso em Server Components: redireciona pro login se não houver admin logado. */
export async function requireAdmin(): Promise<void> {
  if (!(await getAdminUser())) redirect("/admin/login");
}
