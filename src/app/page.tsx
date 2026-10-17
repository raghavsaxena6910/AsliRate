import Link from "next/link";
import { FileSpreadsheet, FileText, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RateLedger } from "@/components/landing/rate-ledger";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR } from "@/lib/engine/money";
import { sampleComparison } from "@/lib/demo/sample-quotes";

const COUNTS = [
  {
    term: "GST you can claim back",
    detail:
      "If you're GST-registered and the supplier has a GSTIN, the GST is input tax credit, not cost. A price that \"includes GST\" can turn out cheaper than a lower price plus GST.",
  },
  {
    term: "Freight and other charges",
    detail: "Delivery, loading and printing charges get added to the order. A quote that says nothing about freight is flagged, not assumed free.",
  },
  {
    term: "Minimum order and pack size",
    detail: "If a supplier only sells 10,000 and you need 5,000, you pay for 10,000. AsliRate shows the extra stock and what it costs you.",
  },
  {
    term: "Validity and delivery date",
    detail: "Expired quotes and delivery times that miss your deadline are called out before you place an order.",
  },
  {
    term: "Like-for-like items",
    detail: "A 5-ply box quoted against a 3-ply one isn't a fair comparison. You mark mismatches when you check the numbers.",
  },
];

const STEPS = [
  {
    title: "Add your quotes",
    body: "Two to six suppliers. PDFs, WhatsApp screenshots, Excel rate lists or text you paste in.",
  },
  {
    title: "Check the numbers",
    body: "AsliRate reads each quote and shows where every number came from. You confirm or correct anything it wasn't sure about.",
  },
  {
    title: "See the real ranking",
    body: "Suppliers ranked by what the order actually costs you, with the working shown and anything to check before you order.",
  },
];

/** The worked example under "numbers you can check", taken straight from the engine. */
function WorkedExample() {
  const result = compareQuotes(sampleComparison("2026-10-17"));
  const b = result.results.find((r) => r.quote_id === "B")!;
  const lines: [string, string, string?][] = [
    ["You pay the supplier: 5,000 boxes at ₹19.50, GST included", formatINR(b.cash_outlay_paise)],
    ["Freight", "Included", "muted"],
    ["GST inside that price (18%), claimed back as input tax credit", `−${formatINR(b.gst_credit_paise)}`, "muted"],
  ];
  return (
    <div className="rounded-lg border border-line-2 bg-white">
      <div className="border-b border-line px-5 py-3">
        <p className="text-[15px] font-semibold text-ink">Om Corrugators, the working</p>
      </div>
      <dl className="divide-y divide-line px-5">
        {lines.map(([label, value, tone]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2.5 text-[15px]">
            <dt className={tone === "muted" ? "text-ink-2" : "text-ink"}>{label}</dt>
            <dd className={`num ${tone === "muted" ? "text-ink-2" : "text-ink"}`}>{value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-3 text-[17px] font-bold text-stamp">
          <dt>Real cost of the order</dt>
          <dd className="num">{formatINR(b.effective_cost_paise)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-28">
          <div>
            <h1 className="max-w-[16ch] text-[2.6rem] leading-[1.04] font-bold tracking-[-0.025em] text-ink sm:text-[3.4rem]">
              The lowest quote isn&rsquo;t always the lowest cost.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-2">
              Upload supplier quotes as PDFs, WhatsApp screenshots or Excel sheets. AsliRate counts GST credit, freight
              and minimum order, then ranks suppliers by what each order really costs you in rupees.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/demo">Try it with sample quotes</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-ink-3">The demo needs no sign-up and takes about a minute.</p>
          </div>
          <RateLedger />
        </section>

        <section className="border-t border-line bg-paper-2">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2 className="text-[1.9rem] leading-tight font-bold tracking-[-0.015em] text-ink">
                What a quote&rsquo;s price leaves out
              </h2>
              <p className="mt-4 max-w-[44ch] leading-relaxed text-ink-2">
                Suppliers quote in their own format. One includes GST, one adds freight, one has a minimum order. AsliRate
                puts them on the same basis before comparing.
              </p>
            </div>
            <dl className="divide-y divide-line-2 border-y border-line-2">
              {COUNTS.map((c) => (
                <div key={c.term} className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="font-semibold text-ink">{c.term}</dt>
                  <dd className="max-w-[60ch] leading-relaxed text-ink-2">{c.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
          <h2 className="text-[1.9rem] leading-tight font-bold tracking-[-0.015em] text-ink">How it works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t-2 border-ink pt-5">
                <span className="num text-sm font-semibold text-ink-3">Step {i + 1}</span>
                <h3 className="mt-1 text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 max-w-[38ch] leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            <span className="inline-flex items-center gap-2">
              <FileText className="size-4 text-ink-3" aria-hidden /> PDF quotations
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageSquareText className="size-4 text-ink-3" aria-hidden /> WhatsApp screenshots and photos
            </span>
            <span className="inline-flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-ink-3" aria-hidden /> Excel rate lists
            </span>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 className="text-[1.9rem] leading-tight font-bold tracking-[-0.015em] text-ink">Numbers you can check</h2>
              <p className="mt-4 max-w-[48ch] leading-relaxed text-ink-2">
                AI reads your quotes. It doesn&rsquo;t do the maths. Every rupee comes from a fixed calculator that gives the
                same answer for the same inputs, and every result shows its working, line by line.
              </p>
              <p className="mt-4 max-w-[48ch] leading-relaxed text-ink-2">
                So when you tell a partner or your CA why you chose a supplier, you can show them exactly how.
              </p>
            </div>
            <WorkedExample />
          </div>
        </section>

        <section className="bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[1.75rem] leading-tight font-bold tracking-[-0.015em]">See it on three real-looking quotes</h2>
              <p className="mt-2 max-w-[52ch] text-white/75">
                A PDF, a WhatsApp message and an Excel sheet for the same shipping box. Edit any number and watch the
                ranking change.
              </p>
            </div>
            <Button asChild size="lg" className="bg-white text-ink hover:bg-white/90">
              <Link href="/demo">Open the demo</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
