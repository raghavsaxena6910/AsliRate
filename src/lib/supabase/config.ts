/**
 * Supabase connection settings.
 *
 * The URL and publishable key are public by design (they ship to every
 * browser; row-level security protects the data), so they have safe
 * defaults here and can be overridden with environment variables.
 * Secret keys never live in code.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ljqcnvulhdsfukglcyjq.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_jN0rFAjfDadSMkmHfSTepw_DJwb1MDT";

/** Pages that need a signed-in user. */
export const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/comparisons", "/settings", "/billing"];
/** Pages a signed-in user doesn't need (sent to the dashboard instead). */
export const AUTH_PAGES = ["/login", "/signup"];

/** Only allow redirects to paths on this site ("/dashboard"), never to other domains. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
