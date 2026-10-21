import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NewComparisonForm } from "@/components/comparisons/new-comparison-form";
import { StepBar } from "@/components/comparisons/step-bar";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { getPlan } from "@/lib/billing/server";
import { LimitReached } from "@/components/billing/plan-strip";

export const metadata: Metadata = { title: "New comparison" };

export default function NewComparisonPage() {
  return (
    <>
      <AppHeader />
      <main className="flex-1" data-clarity-mask="true">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <StepBar current={0} />
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">New comparison</h1>
          <p className="mt-2 mb-8 max-w-[60ch] text-lg leading-relaxed text-ink-2">
            Describe what you&rsquo;re buying. Next you&rsquo;ll add between 2 and 6 supplier quotes.
          </p>
          <Suspense fallback={<p className="text-ink-3">Loading…</p>}>
            <FormLoader />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function FormLoader() {
  const user = await requireUser("/comparisons/new");
  const profile = await getProfile(user.id);
  if (!profile?.onboarded_at) redirect("/onboarding");
  const plan = await getPlan(user.id);
  if (!plan.pro && plan.used >= plan.limit) return <LimitReached />;
  return <NewComparisonForm gstRegistered={profile.gst_registered} />;
}
