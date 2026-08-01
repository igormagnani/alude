import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Autenticação Instagram · variante "API do Instagram com Login do
 * Instagram" (graph.instagram.com), substitui a variante antiga via Página
 * do Facebook (graph.facebook.com).
 *
 * Token mora em `alude_settings.ig_auth` (jsonb). Bootstrap automático: se a
 * chave ainda não existir no banco e `ALUDE_IG_ACCESS_TOKEN` estiver setado
 * no ambiente, valida esse token contra /me e persiste no banco no primeiro
 * uso. Dali em diante o banco é a fonte da verdade (o refresh troca o token
 * e o env fica obsoleto, e tudo bem).
 */

export const IG_GRAPH_BASE = "https://graph.instagram.com/v23.0";

const REFRESH_DUE_MS = 7 * 24 * 60 * 60 * 1000;

export type IgAuth = {
  token: string;
  user_id: string;
  username: string | null;
  refreshed_at: string;
  expires_at: string | null;
};

export type IgRefreshResult = { refreshed: boolean; reason?: string; last_error?: string };

async function igGet(path: string, params: Record<string, string>, token: string) {
  const url = new URL(`${IG_GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new Error(`Instagram Graph GET ${path}: ${JSON.stringify(json)}`);
  return json;
}

async function saveIgAuth(auth: IgAuth): Promise<void> {
  await supabaseAdmin
    .from("alude_settings")
    .upsert({ key: "ig_auth", value: auth, updated_at: new Date().toISOString() });
}

/**
 * Lê o token ativo. Ordem: banco primeiro; se ausente, bootstrap a partir
 * do env (valida contra /me, persiste, retorna). Sem banco e sem env,
 * retorna null (quem chama trata como awaiting_connection).
 */
export async function getIgAuth(): Promise<IgAuth | null> {
  const { data } = await supabaseAdmin.from("alude_settings").select("value").eq("key", "ig_auth").maybeSingle();
  const stored = data?.value as Partial<IgAuth> | null | undefined;
  if (stored?.token && stored.user_id) return stored as IgAuth;

  const envToken = process.env.ALUDE_IG_ACCESS_TOKEN;
  if (!envToken) return null;

  const me = await igGet("/me", { fields: "user_id,username,followers_count,media_count" }, envToken);
  const now = new Date();
  const auth: IgAuth = {
    token: envToken,
    user_id: String(me.user_id ?? me.id),
    username: typeof me.username === "string" ? me.username : null,
    refreshed_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  };
  await saveIgAuth(auth);
  return auth;
}

/**
 * Renova o token se `refreshed_at` já passou de 7 dias (a API só aceita
 * renovar token com mais de 24h de vida, então a janela de 7 dias já cobre
 * essa exigência com folga). Falha de renovação nunca derruba o cron: só
 * reporta `last_error` pra quem chamou logar.
 */
export async function refreshIgTokenIfDue(): Promise<IgRefreshResult> {
  const auth = await getIgAuth();
  if (!auth) return { refreshed: false, reason: "sem token configurado" };

  const refreshedAt = new Date(auth.refreshed_at).getTime();
  if (Number.isFinite(refreshedAt) && Date.now() - refreshedAt < REFRESH_DUE_MS) {
    return { refreshed: false, reason: "ainda dentro da janela de 7 dias" };
  }

  try {
    const url = new URL(`${IG_GRAPH_BASE}/refresh_access_token`);
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", auth.token);
    const res = await fetch(url.toString());
    const json = await res.json();
    if (!res.ok || typeof json.access_token !== "string") {
      throw new Error(JSON.stringify(json));
    }

    const now = new Date();
    const expiresInMs = (typeof json.expires_in === "number" ? json.expires_in : 60 * 24 * 60 * 60) * 1000;
    const updated: IgAuth = {
      ...auth,
      token: json.access_token,
      refreshed_at: now.toISOString(),
      expires_at: new Date(now.getTime() + expiresInMs).toISOString(),
    };
    await saveIgAuth(updated);
    return { refreshed: true };
  } catch (e) {
    return { refreshed: false, last_error: e instanceof Error ? e.message : String(e) };
  }
}
