import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { LandedCostCalculator } from "@/components/tools/landed-cost-calculator";

export const metadata: Metadata = {
  title: "Landed cost calculator (GST, freight, MOQ)",
  description:
    "Free calculator for Indian buyers: the real cost per unit of a supplier quote after GST input credit, freight, minimum order quantity and pack size.",
  alternates: { canonical: "/tools/landed-cost-calculator" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AsliRate landed cost calculator",
  url: "https://www.aslirate.in/tools/landed-cost-calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

export default function CalculatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase">Free tool</p>
          <h1 className="mt-2 max-w-[24ch] text-[2.2rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance text-ink sm:text-[2.6rem]">
            Landed cost calculator
          </h1>
          <p className="mt-3 max-w-[64ch] text-lg leading-relaxed text-ink-2">
            Enter one supplier quote. See what each unit really costs once GST credit, freight and the minimum order are
            counted. No sign-up needed.
          </p>
          <div className="mt-8">
            <LandedCostCalculator />
          </div>

          <section className="prose-guide mt-14 max-w-[72ch]">
            <h2>How the calculator works</h2>
            <ol>
              <li>
                It rounds your quantity up to the <strong>minimum order</strong> and to whole <strong>packs</strong>, because
                that is what you pay for.
              </li>
              <li>It adds freight to the goods and works out GST on the total.</li>
              <li>
                If you are GST-registered and the supplier has a GSTIN, it takes the GST off as{" "}
                <Link href="/blog/input-tax-credit-on-purchases">input tax credit</Link>.
              </li>
              <li>It divides the result by the quantity you need, which gives the real rate per unit.</li>
            </ol>
            <p>
              The numbers come from the same calculation engine AsliRate uses to rank full comparisons. Read more in{" "}
              <Link href="/blog/landed-cost-calculation">how to calculate landed cost</Link> and{" "}
              <Link href="/blog/gst-inclusive-vs-exclusive-price">GST inclusive vs exclusive prices</Link>. This is general
              information, not tax advice; confirm GST treatment with your accountant.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
