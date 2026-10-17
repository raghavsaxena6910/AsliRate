import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./site-chrome";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-[68ch] px-4 py-12 sm:px-6 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:leading-relaxed [&_ul]:text-ink-2">
          <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink">{title}</h1>
          <p className="text-sm text-ink-3">Last updated {updated}</p>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
