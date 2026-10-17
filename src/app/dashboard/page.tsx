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

export const metadata: Metadata = { title: "Comparisons" };

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="flex-1">
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
  const { data: comparisons, error } = await supabase
    .from("comparisons")
    .select("id, item_description, qty_needed, unit, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

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
      </div>

      {error && <p className="text-danger">We couldn&rsquo;t load your comparisons. Refresh to try again.</p>}

      {comparisons && comparisons.length > 0 ? (
        <ul className="divide-y divide-line rounded-lg border border-line-2">
          {comparisons.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{c.item_description}</p>
                <p className="text-sm text-ink-3">
                  {formatQty(toMilli(Number(c.qty_needed)))} {c.unit},{" "}
                  {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className="rounded-full bg-paper-2 px-3 py-1 text-[13px] font-semibold text-ink-2">{c.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-line-2 px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-ink">No comparisons yet</h2>
          <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-ink-2">
            Uploading your own quotes opens soon. Until then, see a full comparison with three sample quotes.
          </p>
          <Button asChild className="mt-6">
            <Link href="/demo">Open the demo</Link>
          </Button>
        </div>
      )}
    </>
  );
}
