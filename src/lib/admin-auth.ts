import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeEqual, sha256Hex } from "./secure-compare";

export const ADMIN_COOKIE = "alude_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

/** Hash esperado no cookie, derivado da chave de admin configurada no env. */
function expectedHash(): string | null {
  const key = process.env.ALUDE_ADMIN_KEY;
  if (!key) return null;
  return sha256Hex(key);
}

/** Confere se a chave digitada bate com ALUDE_ADMIN_KEY (timing-safe). */
export function checkAdminKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return safeEqual(key, process.env.ALUDE_ADMIN_KEY);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

/** Lê o cookie de uma request de Route Handler e diz se autentica. */
export function isAdminRequest(req: Request): boolean {
  const expected = expectedHash();
  if (!expected) return false;
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  if (!match) return false;
  const value = decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1));
  return safeEqual(value, expected);
}

/** Uso em Server Components: redireciona pro login se o cookie não bater. */
export async function requireAdmin(): Promise<void> {
  const expected = expectedHash();
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!expected || !value || !safeEqual(value, expected)) {
    redirect("/admin/login");
  }
}
