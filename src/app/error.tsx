"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shown when a page hits an unexpected error. The header and footer still render from the layout. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-danger uppercase">Something went wrong</p>
        <h1 className="mt-2 text-[2.2rem] leading-tight font-bold tracking-[-0.02em] text-ink">This page didn&rsquo;t load</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-2">
          Your comparisons and quotes are safe. Try again, and if it keeps happening, email raghavjsaxena@gmail.com
          {error.digest ? (
            <>
              {" "}
              with this code: <span className="num font-semibold text-ink">{error.digest}</span>
            </>
          ) : null}
          .
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">My comparisons</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
