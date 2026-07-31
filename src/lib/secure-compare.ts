import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Comparação de segredos resistente a timing attack.
 * Compara o hash SHA-256 dos dois lados: `timingSafeEqual` exige buffers de
 * mesmo tamanho, e hashear normaliza o comprimento sem vazar o tamanho do
 * segredo real. Retorna false pra qualquer entrada vazia/nula.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Autoriza uma request máquina-a-máquina via `Authorization: Bearer <secret>`.
 * Só aceita o header Bearer (sem `?key=` na URL, que vaza em log/Referer).
 * Fail-closed: sem o env `secret` configurado, nega.
 */
export function authorizeBearer(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return safeEqual(auth, `Bearer ${secret}`);
}

/** Hash SHA-256 hex de uma string (usado pro cookie de admin). */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
