import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { BillingButton } from "@/components/billing/billing-button";
import { requireUser } from "@/lib/auth/dal";
import { openBillingPortal, startCheckout } from "@/lib/billing/actions";
import { billingConfigured, dodo, getPlan, saveSubscription } from "@/lib/billing/server";
import { FREE_MONTHLY_LIMIT, PRO_PRICE_RUPEES, nextResetLabel } from "@/lib/billing/rules";

export const metadata: Metadata = { title: "Plan and billing" };

type Search = Promise<{ checkout?: string; subscription_id?: string }>;

export default function BillingPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1" data-clarity-mask="true">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Plan and billing</h1>
          <Suspense fallback={<p className="mt-6 text-ink-3">Loading your plan…</p>}>
            <Billing searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : null;

async function Billing({ searchParams }: { searchParams: Search }) {
  const user = await requireUser("/billing");
  const params = await searchParams;

  // Back from Dodo's checkout: confirm with Dodo directly, so Pro switches on
  // even if the webhook is a few seconds behind.
  if (params.subscription_id && billingConfigured()) {
    try {
      const sub = await dodo().subscriptions.retrieve(params.subscription_id);
      if (sub.metadata?.user_id === user.id) await saveSubscription(sub, new Date(), user.id);
    } catch (err) {
      console.error("Could not confirm subscription", err);
    }
  }

  const plan = await getPlan(user.id);
  const justPaid = params.checkout === "done";

  if (plan.pro) {
    const end = fmtDate(plan.periodEnd);
    return (
      <section className="mt-8 rounded-2xl border-2 border-brand bg-white p-7">
        {justPaid && (
          <p role="status" className="mb-5 rounded-md bg-brand-2 px-4 py-3 font-semibold text-brand-deep">
            Payment received. Welcome to Pro.
          </p>
        )}
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">Your plan</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">Pro, ₹{PRO_PRICE_RUPEES} a month</h2>
        <p className="mt-2 text-ink-2">
          {plan.status === "past_due"
            ? "Your last payment didn't go through. Update your payment method to keep Pro."
            : plan.status === "cancelled" || plan.status === "expired" || plan.cancelAtPeriodEnd
              ? `Cancelled. You keep Pro until ${end ?? "the end of the period you paid for"}.`
              : end
                ? `Renews on ${end}.`
                : "Active."}
        </p>
        <p className="mt-1 text-ink-2">Unlimited comparisons. {plan.used} run this month.</p>
        <div className="mt-6">
          <BillingButton action={openBillingPortal} label="Manage billing and invoices" variant="outline" />
          <p className="mt-2 text-sm text-ink-3">Change your card or UPI, download invoices, or cancel.</p>
        </div>
      </section>
    );
  }

  const left = Math.max(0, plan.limit - plan.used);
  return (
    <>
      {justPaid && (
        <p role="status" className="mt-6 rounded-md bg-amber-2 px-4 py-3 text-amber">
          We&rsquo;re confirming your payment with the bank. This usually takes under a minute;{" "}
          <Link href="/billing?checkout=done" className="font-semibold underline">
            refresh this page
          </Link>
          . If Pro hasn&rsquo;t switched on after 10 minutes, email raghavjsaxena@gmail.com.
        </p>
      )}
      <section className="mt-8 rounded-2xl border border-line-2 bg-paper-2 p-7">
        <p className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Your plan</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">Free</h2>
        <p className="mt-2 text-ink-2">
          {plan.used} of {FREE_MONTHLY_LIMIT} comparisons used this month.{" "}
          {left === 0 ? `Your allowance resets on ${nextResetLabel()}.` : `${left} left until ${nextResetLabel()}.`}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white" aria-hidden>
          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (plan.used / plan.limit) * 100)}%` }} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-brand bg-white p-7">
        <h2 className="text-2xl font-bold text-ink">
          Pro <span className="num">₹{PRO_PRICE_RUPEES}</span>
          <span className="text-base font-semibold text-ink-3"> a month + GST</span>
        </h2>
        <ul className="mt-4 space-y-2 text-ink-2">
          {[
            "Unlimited comparisons, every month",
            "Up to 6 quotes per comparison, in any format",
            "An invoice for every payment, with your company name and GSTIN",
            "Cancel any time; Pro stays on until the month you paid for ends",
          ].map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {billingConfigured() ? (
            <>
              <BillingButton action={startCheckout} label="Upgrade to Pro" />
              <p className="mt-2 text-sm text-ink-3">
                Pay by UPI or card on Dodo Payments&rsquo; secure page. You can add your GSTIN there for the invoice.{" "}
                <Link href="/refunds" className="underline">
                  Refund policy
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="rounded-md bg-paper-2 px-4 py-3 text-ink-2">Paid plans open very soon. Your free comparisons keep working.</p>
          )}
        </div>
      </section>
    </>
  );
}
