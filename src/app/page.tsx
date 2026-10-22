import Link from "next/link";
import { FileSpreadsheet, FileText, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/landing/price-tag";
import { Layer } from "@/components/landing/layer";
import { RateLedger } from "@/components/landing/rate-ledger";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR } from "@/lib/engine/money";
import { sampleComparison } from "@/lib/demo/sample-quotes";

/** Sticker price vs real rate for the MOQ-trap supplier, straight from the engine. */
function moqExample() {
  const r = compareQuotes(sampleComparison("2026-10-17"));
  const c = r.results.find((x) => x.quote_id === "C")!;
  const q = r.input.quotes.find((x) => x.id === "C")!;
  return { quoted: formatINR(q.unit_price_paise), real: formatINR(c.effective_per_unit_paise) };
}

const LEAVES_OUT = [
  {
    term: "GST you can claim back",
    detail:
      "Registered with a supplier who has a GSTIN? Their GST is input tax credit, not cost. A price \"including GST\" can beat a lower price plus GST.",
  },
  {
    term: "Freight and other charges",
    detail: "Delivery, loading and printing get added to the order. A quote silent on freight is flagged, not assumed free.",
  },
  {
    term: "Minimum order and pack size",
    detail: "Need 5,000 but the minimum is 10,000? You pay for 10,000. We show the extra stock and what it costs.",
  },
  {
    term: "Validity and delivery date",
    detail: "Expired quotes and delivery times that miss your deadline are called out before you order.",
  },
  {
    term: "Like-for-like items",
    detail: "A 5-ply box quoted against a 3-ply one isn't a fair fight. You mark mismatches when you check the numbers.",
  },
];

const STEPS = [
  { title: "Add your quotes", body: "Two to six suppliers. PDFs, WhatsApp screenshots, Excel rate lists, or text you paste in." },
  {
    title: "Check the numbers",
    body: "We read each quote and show where every number came from. You confirm or fix anything we weren't sure about.",
  },
  {
    title: "See the real ranking",
    body: "Suppliers ranked by what the order really costs, with the working shown and anything to check before you order.",
  },
];

const FORMATS = [
  { icon: FileText, label: "PDF quotations" },
  { icon: MessageSquareText, label: "WhatsApp screenshots" },
  { icon: FileSpreadsheet, label: "Excel rate lists" },
];

/** The logo's rising arrow, drawn as a faint swoosh behind the hero. */
function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 800 400" fill="none" className={className}>
      <path
        d="M20 360 C 220 330, 430 250, 690 70"
        stroke="url(#sw)"
        strokeWidth="56"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="sw" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#22c445" stopOpacity="0" />
          <stop offset="1" stopColor="#22c445" stopOpacity="0.18" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Home() {
  const moq = moqExample();
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <Layer index={0} className="overflow-hidden bg-white">
          <Swoosh className="pointer-events-none absolute top-24 right-[-30%] w-[900px] max-w-none sm:right-[-12%] lg:right-[-6%]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-2 px-3 py-1 text-[13px] font-semibold text-brand-deep">
                <span aria-hidden className="size-1.5 rounded-full bg-brand-bright" />
                3 free comparisons every month
              </p>
              <h1 className="mt-5 max-w-[15ch] text-[2.7rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink sm:text-[3.6rem]">
                The lowest quote isn&rsquo;t always the lowest cost.
              </h1>
              <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-ink-2">
                Upload supplier quotes in whatever form they arrive. AsliRate counts GST credit, freight and minimum
                order, then ranks suppliers by what each order really costs you in rupees.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/demo">Try it with sample quotes</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/signup">Create a free account</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
                {FORMATS.map(({ icon: Icon, label }) => (
                  <li key={label} className="inline-flex items-center gap-2">
                    <Icon className="size-4 text-brand" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <RateLedger />
          </div>
        </Layer>

        {/* What the price leaves out */}
        <Layer index={1} className="border-t border-line bg-paper-2 md:border-t-0">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-[2rem] leading-tight font-extrabold tracking-[-0.025em] text-ink">
                What a quote&rsquo;s price leaves out
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-2">
                Every supplier quotes in their own format. AsliRate puts them on the same basis before comparing.
              </p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {LEAVES_OUT.map((c) => (
                <dl key={c.term} className="bg-white p-6">
                  <dt className="font-bold text-ink">{c.term}</dt>
                  <dd className="mt-2 leading-relaxed text-ink-2">{c.detail}</dd>
                </dl>
              ))}
              <div className="flex flex-col justify-between gap-4 bg-ink p-6 text-white">
                <p className="text-lg leading-snug font-semibold">See all five at work on three sample quotes.</p>
                <Link href="/demo" className="font-semibold text-brand-bright hover:underline">
                  Open the demo
                </Link>
              </div>
            </div>
          </div>
        </Layer>

        {/* Price tag: numbers you can check */}
        <Layer index={2} className="border-t border-line bg-white md:border-t-0">
          <div className="mx-auto grid max-w-6xl gap-16 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div className="lg:order-2">
              <h2 className="text-[2rem] leading-tight font-extrabold tracking-[-0.025em] text-ink">
                {moq.quoted} on paper. {moq.real} in reality.
              </h2>
              <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-ink-2">
                The cheapest rate on paper can be the most expensive order. Here, a 10,000-box minimum doubles what you
                pay for the 5,000 boxes you actually need.
              </p>
              <ul className="mt-8 grid max-w-[48ch] gap-4">
                <li className="border-l-2 border-brand pl-4 text-ink-2">
                  <span className="font-semibold text-ink">AI reads, it doesn&rsquo;t calculate.</span> Every rupee comes from
                  a fixed calculator that gives the same answer for the same inputs.
                </li>
                <li className="border-l-2 border-brand pl-4 text-ink-2">
                  <span className="font-semibold text-ink">Working shown, line by line.</span> Show your partner or your CA
                  exactly why you chose a supplier.
                </li>
              </ul>
            </div>
            <div className="pt-14 lg:order-1">
              <PriceTag />
            </div>
          </div>
        </Layer>

        {/* How it works */}
        <Layer index={3} id="how-it-works" className="scroll-mt-20 border-t border-line bg-paper-2 md:border-t-0">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-[2rem] leading-tight font-extrabold tracking-[-0.025em] text-ink">How it works</h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="num grid size-10 place-items-center rounded-full bg-brand-2 text-[15px] font-bold text-brand-deep">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 max-w-[36ch] leading-relaxed text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Layer>

        {/* Closing band */}
        <Layer index={4} className="overflow-hidden bg-brand-deep text-white">
          <Swoosh className="pointer-events-none absolute -bottom-24 -left-20 w-[700px] max-w-none opacity-60" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[1.9rem] leading-tight font-extrabold tracking-[-0.025em]">
                Find the real rate on your next order
              </h2>
              <p className="mt-2 max-w-[52ch] text-white/80">
                Try the demo with a PDF, a WhatsApp message and an Excel sheet for the same box, or sign up and compare
                your own.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-ink hover:bg-brand-2">
                <Link href="/demo">Open the demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/signup">Sign up free</Link>
              </Button>
            </div>
          </div>
        </Layer>
      </main>
      <SiteFooter />
    </>
  );
}
