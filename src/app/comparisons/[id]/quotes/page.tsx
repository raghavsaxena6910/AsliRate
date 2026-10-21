import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteUploader } from "@/components/comparisons/quote-uploader";
import { ComparisonSummary } from "@/components/comparisons/comparison-summary";
import { StepBar } from "@/components/comparisons/step-bar";
import { AppHeader } from "@/components/site/app-header";
import { SiteFooter } from "@/components/site/site-chrome";
import { requireUser } from "@/lib/auth/dal";
import { getComparison, listQuotes } from "@/lib/comparisons/queries";
import { kindOf } from "@/lib/extract/file-types";

export const metadata: Metadata = { title: "Add quotes" };

export default function QuotesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1" data-clarity-mask="true">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <StepBar current={1} />
          <Suspense fallback={<p className="text-ink-3">Loading your quotes…</p>}>
            <Quotes params={params} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Quotes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/comparisons/${id}/quotes`);
  const comparison = await getComparison(id);
  const quotes = await listQuotes(comparison.id);
  return (
    <>
      <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">Add the quotes</h1>
      <p className="mt-2 max-w-[62ch] text-lg leading-relaxed text-ink-2">
        One per supplier, in whatever form they sent it. Spreadsheets, PDFs with real text and pasted messages are read
        automatically; for photos you&rsquo;ll type the numbers.
      </p>
      <ComparisonSummary comparison={comparison} className="mt-6 mb-8" />
      <QuoteUploader
        comparisonId={comparison.id}
        userId={user.id}
        initial={quotes.map((q) => ({
          id: q.id,
          label: q.file_name ?? `Pasted: ${(q.pasted_text ?? "").split("\n")[0].slice(0, 50)}`,
          kind: q.file_name ? kindOf(q.file_name, q.mime_type) : "pasted",
          size: q.file_size,
        }))}
      />
    </>
  );
}
