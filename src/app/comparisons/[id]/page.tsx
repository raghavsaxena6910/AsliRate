import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ComparisonSummary } from "@/components/comparisons/comparison-summary";
import { StepBar } from "@/components/comparisons/step-bar";
import { ResultsView } from "@/components/results/results-view";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { getComparison } from "@/lib/comparisons/queries";
import { nextPathFor } from "@/lib/comparisons/schemas";
import { compareQuotes } from "@/lib/engine/compare";
import type { ComparisonInput } from "@/lib/engine/schema";
import { formatDate } from "@/lib/engine/compare";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1" data-clarity-mask="true">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <StepBar current={3} />
          <Suspense fallback={<p className="text-ink-3">Loading the results…</p>}>
            <Results params={params} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Results({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/comparisons/${id}`);
  const comparison = await getComparison(id);
  if (comparison.status !== "complete") redirect(nextPathFor(comparison.id, comparison.status));

  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("results")
    .select("engine_input, rationale, created_at, updated_at")
    .eq("comparison_id", comparison.id)
    .maybeSingle();
  if (!saved) redirect(`/comparisons/${comparison.id}/review`);

  // The engine is deterministic: recomputing from the saved inputs gives the saved answer.
  const result = compareQuotes(saved.engine_input as ComparisonInput);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3">Compared on {formatDate(result.input.as_of)}</p>
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Results</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/comparisons/${comparison.id}/review`}>Edit the numbers</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/comparisons/${comparison.id}/quotes`}>Add or remove quotes</Link>
          </Button>
        </div>
      </div>
      <ComparisonSummary comparison={comparison} className="mb-10" />
      <ResultsView result={result} rationale={saved.rationale ?? undefined} />
      <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
        <Button asChild>
          <Link href="/comparisons/new">New comparison</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">All comparisons</Link>
        </Button>
      </div>
    </>
  );
}
