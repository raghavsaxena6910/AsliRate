import "server-only";
import DodoPayments from "dodopayments";
import type { Subscription } from "dodopayments/resources/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { FREE_MONTHLY_LIMIT, isPro, monthStartInIndia, type SubscriptionRow } from "./rules";

/*
 * Settings live in Vercel → Project → Settings → Environment Variables:
 *   DODO_PAYMENTS_API_KEY        secret, from Dodo → Developer → API Keys (write access on)
 *   DODO_PAYMENTS_WEBHOOK_KEY    secret, from Dodo → Developer → Webhooks
 *   DODO_PAYMENTS_ENVIRONMENT    "test_mode" (default) or "live_mode"
 *   DODO_PRO_PRODUCT_ID          the Pro product's id, e.g. pdt_...
 *   SUPABASE_SECRET_KEY          secret, from Supabase → Project Settings → API Keys
 */

export function dodoEnvironment(): "test_mode" | "live_mode" {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
}

/** True when everything needed to take a payment is set. */
export function billingConfigured(): boolean {
  return Boolean(
    process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PRO_PRODUCT_ID && (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export function dodo() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) throw new Error("DODO_PAYMENTS_API_KEY is not set");
  return new DodoPayments({
    bearerToken,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: dodoEnvironment(),
  });
}

const admin = adminClient;

/**
 * Save what Dodo says about a subscription. Events can arrive out of order, so
 * an event older than the last one applied is ignored.
 */
export async function saveSubscription(sub: Subscription, eventAt: Date, knownUserId?: string): Promise<"saved" | "stale" | "no-user"> {
  const db = admin();
  let userId = knownUserId ?? sub.metadata?.user_id;
  if (!userId) {
    const bySub = await db.from("subscriptions").select("user_id").eq("subscription_id", sub.subscription_id).maybeSingle();
    userId = bySub.data?.user_id;
  }
  if (!userId) {
    const byCustomer = await db.from("subscriptions").select("user_id").eq("customer_id", sub.customer.customer_id).limit(1).maybeSingle();
    userId = byCustomer.data?.user_id;
  }
  if (!userId) return "no-user";

  const { data: existing } = await db.from("subscriptions").select("last_event_at, subscription_id").eq("user_id", userId).maybeSingle();
  if (
    existing?.last_event_at &&
    existing.subscription_id === sub.subscription_id &&
    new Date(existing.last_event_at).getTime() > eventAt.getTime()
  ) {
    return "stale";
  }

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "dodo",
      customer_id: sub.customer.customer_id,
      subscription_id: sub.subscription_id,
      product_id: sub.product_id,
      status: sub.status,
      current_period_end: sub.next_billing_date,
      cancel_at_period_end: sub.cancel_at_next_billing_date,
      last_event_at: eventAt.toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Could not save subscription: ${error.message}`);
  return "saved";
}

/** Yes/no checks that each billing setting is present and accepted. Never returns the values. */
export async function billingHealth() {
  const out = {
    environment: dodoEnvironment(),
    dodo_api_key: false,
    pro_product_found: false,
    webhook_key_set: Boolean(process.env.DODO_PAYMENTS_WEBHOOK_KEY),
    supabase_secret_key: false,
  };
  try {
    const product = await dodo().products.retrieve(process.env.DODO_PRO_PRODUCT_ID ?? "");
    out.dodo_api_key = true;
    out.pro_product_found = product.product_id === process.env.DODO_PRO_PRODUCT_ID;
  } catch (err) {
    const status = (err as { status?: number }).status;
    out.dodo_api_key = status === 404; // key accepted, product missing
  }
  try {
    const { error } = await admin().from("subscriptions").select("user_id", { count: "exact", head: true });
    out.supabase_secret_key = !error;
  } catch {
    out.supabase_secret_key = false;
  }
  return out;
}

export type Plan = {
  pro: boolean;
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
  used: number;
  limit: number;
};

/** The signed-in user's plan and how many free comparisons they've used this month. */
export async function getPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();
  const [{ data: sub }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, customer_id")
      .eq("user_id", userId)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("comparison_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStartInIndia().toISOString()),
  ]);
  return {
    pro: isPro(sub),
    status: sub?.status ?? null,
    periodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    customerId: sub?.customer_id ?? null,
    used: count ?? 0,
    limit: FREE_MONTHLY_LIMIT,
  };
}
