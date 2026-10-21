"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { billingConfigured, dodo, getPlan } from "./server";

export type BillingState = { message?: string };

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://www.aslirate.in";
}

/** Send the signed-in user to Dodo's secure checkout for Pro. */
export async function startCheckout(): Promise<BillingState> {
  const user = await requireUser("/billing");
  if (!billingConfigured()) return { message: "Payments aren't switched on yet. Please try again soon." };

  const plan = await getPlan(user.id);
  if (plan.pro) redirect("/billing");

  const profile = await getProfile(user.id);
  let url: string | null | undefined;
  try {
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: process.env.DODO_PRO_PRODUCT_ID!, quantity: 1 }],
      customer: { email: user.email ?? "", name: profile?.full_name || profile?.company_name || user.email || "AsliRate customer" },
      customer_business_name: profile?.company_name ?? undefined,
      billing_address: { country: "IN" },
      // Business customers can add their GSTIN to get a GST invoice.
      feature_flags: { allow_tax_id: true },
      metadata: { user_id: user.id },
      return_url: `${await origin()}/billing?checkout=done`,
    });
    url = session.checkout_url;
  } catch (err) {
    console.error("Dodo checkout failed", err);
  }
  if (!url) return { message: "We couldn't open the payment page. Please try again in a minute." };
  redirect(url);
}

/** Dodo's customer portal: change card or UPI, download invoices, cancel. */
export async function openBillingPortal(): Promise<BillingState> {
  const user = await requireUser("/billing");
  const plan = await getPlan(user.id);
  if (!plan.customerId || !billingConfigured()) return { message: "We couldn't find your subscription. Email us and we'll sort it out." };
  let link: string | undefined;
  try {
    link = (await dodo().customers.customerPortal.create(plan.customerId)).link;
  } catch (err) {
    console.error("Dodo portal failed", err);
  }
  if (!link) return { message: "We couldn't open your billing details. Please try again in a minute." };
  redirect(link);
}
