import { NextResponse } from "next/server";
import { checkAdminKey, cookieOptions, ADMIN_COOKIE } from "@/lib/admin-auth";
import { sha256Hex } from "@/lib/secure-compare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key: string | undefined = body?.key;
  if (!checkAdminKey(key)) {
    return NextResponse.json({ error: "Chave incorreta." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sha256Hex(key!), cookieOptions());
  return res;
}
