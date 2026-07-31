import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role. Server-only: nunca importar em
 * componente client nem expor a chave ao browser. Usado por todas as
 * rotas /api/admin e /api/cron da máquina de conteúdo do Alude.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } }
);
