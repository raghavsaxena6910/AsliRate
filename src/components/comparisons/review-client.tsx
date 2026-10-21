"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Info, Loader2, PencilLine } from "lucide-react";
import { confirmAndCompare } from "@/lib/comparisons/actions";
import type { ReviewItem } from "@/lib/comparisons/queries";
import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/engine/compare";
import type { FormErrors, QuoteForm } from "@/lib/review/quote-form";
import { QuoteReviewCard } from "@/components/review/quote-review-card";
import { Button } from "@/components/ui/button";

export function ReviewClient({ comparisonId, unit, items }: { comparisonId: string; unit: string; items: ReviewItem[] }) {
  const [forms, setForms] = useState<QuoteForm[]>(items.map((i) => i.form));
  const [errors, setErrors] = useState<Record<string, FormErrors>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [pending, start] = useTransition();

  const toCheck = forms.reduce((n, f) => n + Object.values(f.confidence).filter((c) => c != null && c < LOW_CONFIDENCE_THRESHOLD).length, 0);
  const errorCount = Object.values(errors).reduce((n, e) => n + Object.keys(e).length, 0);

  function submit() {
    setMessage(null);
    start(async () => {
      const res = await confirmAndCompare(comparisonId, forms);
      if (!res) return;
      setErrors(res.errors ?? {});
      if (res.message) setMessage(res.message);
      setUpgrade(Boolean(res.upgrade));
      if (res.errors) requestAnimationFrame(() => document.querySelector(".text-danger")?.scrollIntoView({ block: "center", behavior: "smooth" }));
    });
  }

  return (
    <div>
      {toCheck > 0 && (
        <p className="mb-6 max-w-[68ch] rounded-md bg-amber-2 px-4 py-3 text-[15px] text-amber">
          {toCheck === 1 ? "One value is" : `${toCheck} values are`} highlighted because we weren&rsquo;t sure we read them right.
          Check against the original, then press &ldquo;Looks right&rdquo; or correct it.
        </p>
      )}

      <div className="space-y-10">
        {items.map((item, i) => (
          <section key={item.form.id} aria-label={`Quote ${i + 1}`}>
            <div className="mb-3 flex items-start gap-2.5 text-[14.5px] leading-relaxed">
              {item.method === "manual" ? (
                <PencilLine className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
              ) : item.found.length ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              )}
              <p className="text-ink-2">
                <span className="font-semibold text-ink">Quote {i + 1}.</span> {item.note}
                {item.found.length > 0 && <span className="text-ink-3"> Found: {item.found.join(", ")}.</span>}
              </p>
            </div>

            <div className={item.isImage && item.url ? "grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:items-start" : ""}>
              {item.isImage && item.url && (
                <figure className="rounded-xl border border-line-2 bg-paper-2 p-2 lg:sticky lg:top-24">
                  {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, shown as-is */}
                  <img src={item.url} alt={`Original quote: ${item.label}`} className="max-h-[70vh] w-full rounded-lg object-contain" />
                  <figcaption className="mt-2 px-1 text-[12.5px] text-ink-3">The original, for typing the numbers in.</figcaption>
                </figure>
              )}
              <div className="min-w-0">
                {item.pastedText && (
                  <details className="mb-3 rounded-lg border border-line px-4 py-2 text-[14px]">
                    <summary className="cursor-pointer font-medium text-ink-2">Show the pasted text</summary>
                    <pre className="mt-2 font-sans whitespace-pre-wrap text-ink-2">{item.pastedText}</pre>
                  </details>
                )}
                <QuoteReviewCard
                  form={forms[i]}
                  unit={unit}
                  errors={errors[item.form.id]}
                  file={item.url ? { name: item.label, href: item.url, kind: item.kind } : undefined}
                  onChange={(next) => setForms((all) => all.map((f, j) => (j === i ? next : f)))}
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      {(errorCount > 0 || message) && (
        <p role="alert" className="mt-8 font-medium text-danger">
          {message ?? `Fix the ${errorCount === 1 ? "highlighted field" : `${errorCount} highlighted fields`} to compare.`}
          {upgrade && (
            <>
              {" "}
              <Link href="/billing" className="font-semibold underline">
                See Pro
              </Link>
              . Your numbers are saved.
            </>
          )}
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" onClick={submit} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Comparing
            </>
          ) : (
            "Compare quotes"
          )}
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href={`/comparisons/${comparisonId}/quotes`}>Add or remove quotes</Link>
        </Button>
      </div>
      <p className="mt-3 text-sm text-ink-3">What you type is saved when you press Compare, so you can come back to it.</p>
    </div>
  );
}
