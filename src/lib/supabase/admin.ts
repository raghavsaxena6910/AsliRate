import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Supabase with the secret key (SUPABASE_SECRET_KEY in Vercel). Server only.
 * Bypasses row-level security, so use it only for narrow, checked jobs:
 * saving Dodo-confirmed subscriptions and reading shared results by token.
 */
export function adminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
