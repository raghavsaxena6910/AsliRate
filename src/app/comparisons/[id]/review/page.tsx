import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ComparisonSummary } from "@/components/comparisons/comparison-summary";
import { ReviewClient } from "@/components/comparisons/review-client";
import { StepBar } from "@/components/comparisons/step-bar";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { requireUser } from "@/lib/auth/dal";
import { getComparison, listQuotes, signedUrls, toReviewItem } from "@/lib/comparisons/queries";
import { MIN_QUOTES } from "@/lib/comparisons/schemas";

export const metadata: Metadata = { title: "Check the numbers" };

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <StepBar current={2} />
          </div>
          <Suspense fallback={<p className="text-ink-3">Loading the quotes…</p>}>
            <Review params={params} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/comparisons/${id}/review`);
  const comparison = await getComparison(id);
  const quotes = await listQuotes(comparison.id);
  // Anything added since the last read goes back through the upload step to be read.
  if (quotes.length < MIN_QUOTES || quotes.some((q) => q.extraction_status !== "read")) redirect(`/comparisons/${comparison.id}/quotes`);
  const urls = await signedUrls(quotes);
  const items = quotes.map((q) => toReviewItem(q, urls[q.id] ?? null));

  return (
    <>
      <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Check the numbers</h1>
      <p className="mt-2 max-w-[66ch] text-lg leading-relaxed text-ink-2">
        Here&rsquo;s what we found in each quote and the line it came from. The comparison uses exactly what you confirm here.
      </p>
      <ComparisonSummary comparison={comparison} className="mt-6 mb-8 max-w-3xl" />
      <ReviewClient comparisonId={comparison.id} unit={comparison.unit} items={items} />
    </>
  );
}
