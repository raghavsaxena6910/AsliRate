import { z } from "zod";
import { gstinState, normaliseGstin } from "@/lib/gst";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name.").max(100),
  email,
  company_name: z.string().trim().min(1, "Enter your company name.").max(120),
  password: z.string().min(8, "Use at least 8 characters.").max(72, "Use at most 72 characters."),
  agree: z.literal("on", { error: "Agree to the terms to continue." }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const PRIORITIES = ["cost", "balanced", "speed"] as const;
export const BUSINESS_TYPES = ["D2C brand", "Manufacturer", "Trader or distributor", "Restaurant or café", "Other"] as const;
export const BUY_CATEGORIES = [
  "Packaging",
  "Raw materials",
  "Labels and printing",
  "Components",
  "Finished goods",
  "Services",
] as const;

export const profileSchema = z
  .object({
    company_name: z.string().trim().min(1, "Enter your company name.").max(120),
    gst_registered: z.boolean(),
    gstin: z.string().trim().transform(normaliseGstin),
    business_type: z.enum(BUSINESS_TYPES, { error: "Choose a business type." }),
    city: z.string().trim().max(80),
    usually_buys: z.array(z.enum(BUY_CATEGORIES)).max(BUY_CATEGORIES.length),
    cost_of_funds_pct: z
      .string()
      .trim()
      .transform((v) => Number(v.replace("%", "")))
      .pipe(z.number({ error: "Enter a percentage." }).min(0, "Enter 0 to 60.").max(60, "Enter 0 to 60.")),
    default_priority: z.enum(PRIORITIES),
  })
  .superRefine((v, ctx) => {
    if (v.gst_registered && v.gstin && !gstinState(v.gstin)) {
      ctx.addIssue({ code: "custom", path: ["gstin"], message: "A GSTIN has 15 characters, like 06ABCDE1234F1Z5." });
    }
  })
  .transform((v) => ({
    ...v,
    gstin: v.gst_registered && v.gstin ? v.gstin : null,
    state_code: v.gst_registered && v.gstin ? v.gstin.slice(0, 2) : null,
  }));

export type FieldErrors = Record<string, string>;

/** Flatten Zod issues into { field: first message }. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Turn Supabase auth errors into plain language. */
export function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Check them and try again.";
  if (m.includes("email not confirmed")) return "Confirm your email first: open the link we sent you, then log in.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Log in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a few minutes and try again.";
  if (m.includes("password")) return "Choose a stronger password: at least 8 characters, not a common one.";
  return "Something went wrong. Try again in a moment.";
}
