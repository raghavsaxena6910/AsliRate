import Link from "next/link";
import type { Plan } from "@/lib/billing/server";
import { nextResetLabel } from "@/lib/billing/rules";
import { Button } from "@/components/ui/button";

/** One line under the dashboard heading: what plan you're on and what's left. */
export function PlanStrip({ plan }: { plan: Plan }) {
  if (plan.pro) {
    return (
      <p className="mb-6 text-sm text-ink-3">
        <span className="rounded-full bg-brand-2 px-2.5 py-0.5 font-semibold text-brand-deep">Pro</span> Unlimited comparisons.{" "}
        <Link href="/billing" className="underline hover:text-ink">
          Billing
        </Link>
      </p>
    );
  }
  const left = Math.max(0, plan.limit - plan.used);
  return (
    <p className="mb-6 text-sm text-ink-3">
      Free plan: {plan.used} of {plan.limit} comparisons used this month
      {left === 0 ? `; resets on ${nextResetLabel()}` : ""}.{" "}
      <Link href="/billing" className="font-semibold text-brand underline">
        {left === 0 ? "Upgrade to Pro" : "See Pro"}
      </Link>
    </p>
  );
}

/** Shown instead of the new-comparison form once the free allowance is used. */
export function LimitReached() {
  return (
    <div className="rounded-2xl border-2 border-brand bg-white p-7">
      <h2 className="text-xl font-bold text-ink">You&rsquo;ve used this month&rsquo;s 3 free comparisons</h2>
      <p className="mt-2 leading-relaxed text-ink-2">
        Your free allowance resets on {nextResetLabel()}. Pro gives you unlimited comparisons for ₹999 a month, and you can
        cancel any time. Your past results stay open either way.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/billing">Upgrade to Pro</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to my comparisons</Link>
        </Button>
      </div>
    </div>
  );
}
