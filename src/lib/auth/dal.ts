import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access layer for the signed-in user. Every server read of "who is
 * this?" goes through here. getClaims verifies the session token rather
 * than trusting the cookie.
 */
export async function getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
}

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  gstin: string | null;
  gst_registered: boolean;
  state_code: string | null;
  business_type: string | null;
  city: string | null;
  usually_buys: string[];
  cost_of_funds_pct: number;
  default_priority: "cost" | "balanced" | "speed";
  onboarded_at: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, company_name, gstin, gst_registered, state_code, business_type, city, usually_buys, cost_of_funds_pct, default_priority, onboarded_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return data ? { ...data, cost_of_funds_pct: Number(data.cost_of_funds_pct) } : null;
}
