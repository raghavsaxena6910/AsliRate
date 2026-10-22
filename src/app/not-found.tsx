import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <p className="num text-sm font-semibold tracking-wide text-brand uppercase">Error 404</p>
          <h1 className="mt-2 text-[2.2rem] leading-tight font-bold tracking-[-0.02em] text-ink">We couldn&rsquo;t find that page</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-2">
            The link may be old, or a shared comparison may have been turned off by the person who shared it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">Go to the home page</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">My comparisons</Link>
            </Button>
          </div>
          <p className="mt-10 text-ink-2">
            Or try the free{" "}
            <Link href="/tools/landed-cost-calculator" className="font-semibold text-brand underline">
              landed cost calculator
            </Link>{" "}
            and the{" "}
            <Link href="/blog" className="font-semibold text-brand underline">
              buyer guides
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
