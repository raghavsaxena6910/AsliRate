"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/supabase/config";
import { fieldErrors, friendlyAuthError, loginSchema, profileSchema, signupSchema, type FieldErrors } from "./schemas";

export type FormState = {
  errors?: FieldErrors;
  message?: string;
  /** Sign-up succeeded and Supabase sent a confirmation email. */
  checkEmail?: string;
  values?: Record<string, string>;
};

async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://aslirate.in");
}

/** Keep what the person typed (never the password) so a failed submit doesn't wipe the form. */
function keep(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, ["full_name", "email", "company_name"]);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { full_name, email, company_name, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, company_name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { message: friendlyAuthError(error.message), values };

  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) {
    return { message: friendlyAuthError("already registered"), values };
  }
  if (data.session) redirect("/onboarding");
  return { checkEmail: email };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, ["email"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: friendlyAuthError(error.message), values };
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, ["company_name", "gstin", "business_type", "city", "cost_of_funds_pct", "default_priority"]);
  const parsed = profileSchema.safeParse({
    company_name: formData.get("company_name") ?? "",
    gst_registered: formData.get("not_registered") !== "on",
    gstin: formData.get("gstin") ?? "",
    business_type: formData.get("business_type") ?? "",
    city: formData.get("city") ?? "",
    usually_buys: formData.getAll("usually_buys"),
    cost_of_funds_pct: formData.get("cost_of_funds_pct") ?? "",
    default_priority: formData.get("default_priority") ?? "balanced",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/onboarding");

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, onboarded_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { message: "We couldn't save your details. Try again.", values };
  redirect("/dashboard");
}
