import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { POSTS, readingMinutes } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Guides for buyers",
  description:
    "Plain-language guides for Indian small businesses on comparing supplier quotes, GST input tax credit, landed cost, MOQ and freight terms.",
  alternates: { canonical: "/blog" },
};

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function BlogIndex() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase">Guides</p>
          <h1 className="mt-2 max-w-[22ch] text-[2.4rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance text-ink">
            Buy smarter from suppliers
          </h1>
          <p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-ink-2">
            Short, practical guides on reading quotations, GST credit and the costs that hide below the rate. Every example
            uses real numbers you can check.
          </p>

          <ul className="mt-10 divide-y divide-line border-y border-line">
            {POSTS.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block py-6">
                  <p className="text-sm text-ink-3">
                    {p.tags.join(" · ")} · {readingMinutes(p)} min read
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-ink group-hover:text-brand">{p.title}</h2>
                  <p className="mt-2 max-w-[70ch] leading-relaxed text-ink-2">{p.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    Read the guide <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <section className="mt-12 rounded-2xl bg-paper-2 p-7">
            <h2 className="text-xl font-bold text-ink">Free tool: landed cost calculator</h2>
            <p className="mt-2 max-w-[60ch] leading-relaxed text-ink-2">
              Enter one quote and see what each unit really costs after GST credit, freight and minimum order.
            </p>
            <Link href="/tools/landed-cost-calculator" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand underline">
              Open the calculator <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
          <p className="mt-8 text-sm text-ink-3">Last updated {fmt(POSTS[0].updated ?? POSTS[0].published)}.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
