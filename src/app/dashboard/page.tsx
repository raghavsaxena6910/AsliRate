import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { GST_STATES } from "@/lib/gst";
import { createClient } from "@/lib/supabase/server";
import { formatQty, toMilli } from "@/lib/engine/money";
import { getPlan } from "@/lib/billing/server";
import { PlanStrip } from "@/components/billing/plan-strip";
import { DeleteRowButton } from "@/components/comparisons/delete-row-button";
import { nextPathFor, type ComparisonStatus } from "@/lib/comparisons/schemas";

const STATUS: Record<ComparisonStatus, { label: string; tone: string }> = {
  draft: { label: "Add quotes", tone: "bg-paper-2 text-ink-2" },
  reading: { label: "Add quotes", tone: "bg-paper-2 text-ink-2" },
  review: { label: "Check numbers", tone: "bg-amber-2 text-amber" },
  complete: { label: "Results ready", tone: "bg-brand-2 text-brand-deep" },
};

export const metadata: Metadata = { title: "Comparisons" };

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="flex-1" data-clarity-mask="true">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Suspense fallback={<p className="text-ink-3">Loading your comparisons…</p>}>
            <Dashboard />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Dashboard() {
  const user = await requireUser("/dashboard");
  const profile = await getProfile(user.id);
  if (!profile?.onboarded_at) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: comparisons, error }, plan] = await Promise.all([
    supabase
      .from("comparisons")
      .select("id, item_description, qty_needed, unit, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    getPlan(user.id),
  ]);

  const where = profile.gst_registered
    ? `GST-registered${profile.state_code ? ` in ${GST_STATES[profile.state_code] ?? profile.state_code}` : ""}`
    : "Not GST-registered";

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Comparisons</h1>
          <p className="mt-1 text-ink-2">
            {profile.company_name}, {where}
          </p>
        </div>
        <Button asChild>
          <Link href="/comparisons/new">New comparison</Link>
        </Button>
      </div>

      <PlanStrip plan={plan} />

      {error && <p className="text-danger">We couldn&rsquo;t load your comparisons. Refresh to try again.</p>}

      {comparisons && comparisons.length > 0 ? (
        <ul className="divide-y divide-line rounded-lg border border-line-2">
          {comparisons.map((c) => (
            <li key={c.id} className="relative flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-paper-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={nextPathFor(c.id, c.status as ComparisonStatus)}
                  className="font-semibold text-ink after:absolute after:inset-0 hover:underline"
                >
                  {c.item_description}
                </Link>
                <p className="text-sm text-ink-3">
                  {formatQty(toMilli(Number(c.qty_needed)))} {c.unit},{" "}
                  {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${STATUS[c.status as ComparisonStatus]?.tone ?? ""}`}>
                {STATUS[c.status as ComparisonStatus]?.label ?? c.status}
              </span>
              <DeleteRowButton id={c.id} label={c.item_description} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-line-2 px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-ink">No comparisons yet</h2>
          <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-ink-2">
            Start with what you&rsquo;re buying, then add 2 to 6 supplier quotes. Want to see how it works first? Try the demo
            with three sample quotes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/comparisons/new">Start a comparison</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/demo">Open the demo</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
