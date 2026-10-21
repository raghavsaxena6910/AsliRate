import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";
import { FREE_MONTHLY_LIMIT, PRO_PRICE_RUPEES } from "@/lib/billing/rules";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Free for ${FREE_MONTHLY_LIMIT} supplier-quote comparisons a month. Pro is ₹${PRO_PRICE_RUPEES} a month for unlimited comparisons.`,
};

const FREE = [
  `${FREE_MONTHLY_LIMIT} comparisons a month`,
  "2 to 6 quotes per comparison: PDF, Excel, Word, photos or pasted WhatsApp text",
  "Real cost per unit with GST credit, freight, minimum order and pack size",
  "Plain-language reasons for the ranking",
];

const PRO = [
  "Unlimited comparisons",
  "Everything in Free",
  "An invoice for every payment, with your company name and GSTIN",
  "Cancel any time from your billing page",
];

const FAQ: [string, string][] = [
  [
    "What counts as a comparison?",
    "One set of quotes for one item that you take through to results. Going back and correcting the numbers on a comparison you've already run doesn't use another one.",
  ],
  [
    "When does the free allowance reset?",
    "On the 1st of every month, India time. Results you've already run stay available after that.",
  ],
  [
    "How do I pay?",
    "By UPI, RuPay, or a debit or credit card, on the secure checkout of Dodo Payments, our payment partner. Pro renews monthly until you cancel.",
  ],
  [
    "What does it cost with GST?",
    `₹${PRO_PRICE_RUPEES} a month plus GST at 18%. The exact total is shown at checkout before you pay.`,
  ],
  [
    "Can I cancel?",
    "Yes, any time from your Plan page once you log in. Pro stays on until the end of the month you've paid for, then you're back on Free. See the refund policy for refunds.",
  ],
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h1 className="max-w-[20ch] text-[2.4rem] leading-[1.1] font-bold tracking-[-0.02em] text-ink">
            Start free. Pay when it&rsquo;s saving you money.
          </h1>
          <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-ink-2">
            One wrong supplier pick on a single order can cost more than a year of Pro. Try it on your next three purchases
            first.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="flex flex-col rounded-2xl border border-line-2 bg-paper-2 p-7">
              <h2 className="text-xl font-bold text-ink">Free</h2>
              <p className="mt-3">
                <span className="num text-[2.6rem] leading-none font-extrabold tracking-[-0.03em] text-ink">₹0</span>
              </p>
              <p className="mt-1 text-ink-3">No card needed</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-ink-2">
                {FREE.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="lg" className="mt-8">
                <Link href="/signup">Create a free account</Link>
              </Button>
            </section>

            <section className="flex flex-col rounded-2xl border-2 border-brand bg-white p-7 shadow-[0_24px_48px_-32px_rgba(5,77,39,0.5)]">
              <h2 className="text-xl font-bold text-ink">Pro</h2>
              <p className="mt-3">
                <span className="num text-[2.6rem] leading-none font-extrabold tracking-[-0.03em] text-ink">
                  ₹{PRO_PRICE_RUPEES}
                </span>
                <span className="text-lg font-semibold text-ink-3"> / month</span>
              </p>
              <p className="mt-1 text-ink-3">Plus GST. Billed monthly.</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-ink-2">
                {PRO.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8">
                <Link href="/billing">Get Pro</Link>
              </Button>
              <p className="mt-2 text-center text-sm text-ink-3">You&rsquo;ll log in or sign up first.</p>
            </section>
          </div>

          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold text-ink">Questions</h2>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {FAQ.map(([q, a]) => (
                <div key={q} className="py-5">
                  <dt className="font-semibold text-ink">{q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-2">{a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-ink-2">
              Read the{" "}
              <Link href="/refunds" className="font-semibold text-brand underline">
                refund and cancellation policy
              </Link>
              , or{" "}
              <Link href="/contact" className="font-semibold text-brand underline">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
