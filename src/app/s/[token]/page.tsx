import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ResultsView } from "@/components/results/results-view";
import { SiteFooter, Wordmark } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { compareQuotes, formatDate } from "@/lib/engine/compare";
import { formatQty } from "@/lib/engine/money";
import type { ComparisonInput } from "@/lib/engine/schema";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shared supplier comparison",
  robots: { index: false, follow: false },
};

/** Read-only results someone chose to share. Works without an account. */
export default function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <Button asChild size="sm">
            <Link href="/signup?ref=share">Compare your quotes free</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Suspense fallback={<p className="text-ink-3">Loading the comparison…</p>}>
            <Shared params={params} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Shared({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_result", { token });
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) notFound();

  const result = compareQuotes(row.engine_input as ComparisonInput);
  const { input } = result;

  return (
    <>
      <p className="text-sm text-ink-3">Shared comparison · compared on {formatDate(input.as_of)}</p>
      <h1 className="mt-1 text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">{row.item_description}</h1>
      <p className="mt-1 text-ink-2">
        {formatQty(result.qty_needed_milli)} {input.unit} · {input.buyer_gst_registered ? "GST-registered buyer" : "not GST-registered"} ·{" "}
        {input.quotes.length} quotes
      </p>
      <div className="mt-10">
        <ResultsView result={result} rationale={row.rationale ?? undefined} />
      </div>

      <aside className="mt-14 rounded-2xl bg-brand-deep p-7 text-white sm:p-9">
        <p className="text-sm font-semibold tracking-wide text-brand-bright uppercase">Compared with AsliRate</p>
        <h2 className="mt-2 max-w-[26ch] text-2xl leading-tight font-bold sm:text-[1.8rem]">
          Got supplier quotes of your own? See which one is really cheapest.
        </h2>
        <p className="mt-3 max-w-[60ch] leading-relaxed text-white/85">
          Upload PDFs, Excel sheets, photos or WhatsApp messages. AsliRate counts GST credit, freight and minimum orders, and
          ranks suppliers by what the order really costs. 3 comparisons a month are free.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-brand-deep hover:bg-brand-2">
            <Link href="/signup?ref=share">Start free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
            <Link href="/demo">See how it works</Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
