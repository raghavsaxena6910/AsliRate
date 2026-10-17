"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { compareQuotes, LOW_CONFIDENCE_THRESHOLD, type ComparisonResult } from "@/lib/engine/compare";
import { DEMO_FILES, DEMO_SETUP, demoQuoteForms, type DemoFile } from "@/lib/demo/demo-data";
import {
  formToQuoteInput,
  setupQty,
  validateSetup,
  type FormErrors,
  type QuoteForm,
  type SetupForm,
} from "@/lib/review/quote-form";
import { todayInIndia } from "@/lib/format";
import { track } from "@/lib/analytics";
import { QuoteReviewCard } from "@/components/review/quote-review-card";
import { ResultsView } from "@/components/results/results-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Step = "setup" | "upload" | "review" | "results";
const STEPS: { key: Step; label: string }[] = [
  { key: "setup", label: "What you're buying" },
  { key: "upload", label: "Add quotes" },
  { key: "review", label: "Check numbers" },
  { key: "results", label: "Results" },
];

export function DemoFlow() {
  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupForm>(DEMO_SETUP);
  const [forms, setForms] = useState<QuoteForm[]>(demoQuoteForms);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's heading so keyboard and screen-reader users follow along.
  const go = (next: Step) => {
    setStep(next);
    track("demo_step_viewed", { step: next });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus();
    });
  };

  const reset = () => {
    setSetup(DEMO_SETUP);
    setForms(demoQuoteForms());
    setResult(null);
    go("setup");
  };

  const current = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full bg-carbon-2 px-3 py-1 text-[13px] font-semibold text-carbon">
          Demo with sample quotes. Nothing is saved.
        </p>
        {step !== "setup" && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Start again
          </Button>
        )}
      </div>

      <nav aria-label="Progress">
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key} aria-current={i === current ? "step" : undefined}>
              <div className={cn("h-1 rounded-full", i <= current ? "bg-carbon" : "bg-line")} />
              <p
                className={cn(
                  "mt-2 text-[12.5px] leading-tight sm:text-sm",
                  i === current ? "font-semibold text-ink" : "text-ink-3",
                )}
              >
                <span className="num">{i + 1}.</span> <span className="hidden sm:inline">{s.label}</span>
                <span className="sr-only sm:hidden">{s.label}</span>
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm font-semibold text-ink sm:hidden" aria-hidden>
          Step {current + 1} of {STEPS.length}: {STEPS[current].label}
        </p>
      </nav>

      <div className="mt-10">
        {step === "setup" && (
          <SetupStep headingRef={headingRef} setup={setup} onChange={setSetup} onNext={() => go("upload")} />
        )}
        {step === "upload" && (
          <UploadStep headingRef={headingRef} onBack={() => go("setup")} onNext={() => go("review")} />
        )}
        {step === "review" && (
          <ReviewStep
            headingRef={headingRef}
            setup={setup}
            forms={forms}
            onChange={setForms}
            onBack={() => go("upload")}
            onCompare={(r) => {
              setResult(r);
              track("demo_quotes_compared", { quotes: r.results.length, buyer_gst_registered: r.input.buyer_gst_registered });
              go("results");
            }}
          />
        )}
        {step === "results" && result && (
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="sr-only">
              Results
            </h1>
            <ResultsView result={result} />
            <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
              <Button onClick={() => go("review")}>Edit the numbers</Button>
              <Button variant="outline" onClick={() => go("setup")}>
                Change what you&rsquo;re buying
              </Button>
              <Button variant="ghost" onClick={reset}>
                Start again
              </Button>
            </div>
            <p className="mt-4 max-w-[62ch] text-sm text-ink-3">
              Try clearing Om Corrugators&rsquo; GSTIN, or switching off GST registration, and compare again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

function StepHeading({ headingRef, title, intro }: { headingRef: HeadingRef; title: string; intro: string }) {
  return (
    <div className="mb-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink outline-none"
      >
        {title}
      </h1>
      <p className="mt-2 max-w-[62ch] text-lg leading-relaxed text-ink-2">{intro}</p>
    </div>
  );
}

/* ---------------- Step 1: setup ---------------- */

function SetupStep({
  headingRef,
  setup,
  onChange,
  onNext,
}: {
  headingRef: HeadingRef;
  setup: SetupForm;
  onChange: (s: SetupForm) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<ReturnType<typeof validateSetup>>({});
  const set = <K extends keyof SetupForm>(k: K, v: SetupForm[K]) => onChange({ ...setup, [k]: v });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const errs = validateSetup(setup);
        setErrors(errs);
        if (Object.keys(errs).length === 0) onNext();
      }}
    >
      <StepHeading
        headingRef={headingRef}
        title="What are you buying?"
        intro="We've filled this in for the sample quotes. Change the quantity or GST registration to see how the ranking moves."
      />
      <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="item">Item</Label>
          <Input
            id="item"
            className="mt-1.5"
            value={setup.item_description}
            aria-invalid={!!errors.item_description}
            onChange={(e) => set("item_description", e.target.value)}
          />
          {errors.item_description && <p className="mt-1.5 text-[13px] text-danger">{errors.item_description}</p>}
        </div>
        <div>
          <Label htmlFor="qty">Quantity you need</Label>
          <Input
            id="qty"
            inputMode="decimal"
            className="num mt-1.5"
            value={setup.qty_needed}
            aria-invalid={!!errors.qty_needed}
            onChange={(e) => set("qty_needed", e.target.value)}
          />
          {errors.qty_needed && <p className="mt-1.5 text-[13px] text-danger">{errors.qty_needed}</p>}
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            className="mt-1.5"
            value={setup.unit}
            aria-invalid={!!errors.unit}
            onChange={(e) => set("unit", e.target.value)}
          />
          {errors.unit && <p className="mt-1.5 text-[13px] text-danger">{errors.unit}</p>}
        </div>
        <div>
          <Label htmlFor="required-by">Needed by (optional)</Label>
          <Input
            id="required-by"
            type="date"
            className="mt-1.5"
            value={setup.required_by}
            onChange={(e) => set("required_by", e.target.value)}
          />
          <p className="mt-1.5 text-[12.5px] text-ink-3">We&rsquo;ll flag suppliers who can&rsquo;t deliver in time.</p>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-line-2 p-4 sm:self-start">
          <Switch
            id="gst-reg"
            checked={setup.buyer_gst_registered}
            onCheckedChange={(v) => set("buyer_gst_registered", v)}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="gst-reg" className="text-[15px] text-ink">
              My business is GST-registered
            </Label>
            <p className="mt-1 text-[13px] leading-snug text-ink-3">
              If yes, GST on a proper tax invoice comes back as input tax credit.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Button type="submit" size="lg">
          Continue to quotes
        </Button>
      </div>
    </form>
  );
}

/* ---------------- Step 2: upload (simulated) ---------------- */

const KIND_ICON: Record<DemoFile["kind"], typeof FileText> = { PDF: FileText, Image: ImageIcon, Excel: FileSpreadsheet };

function UploadStep({ headingRef, onBack, onNext }: { headingRef: HeadingRef; onBack: () => void; onNext: () => void }) {
  // -1 = not started; n = number of files read so far.
  const [readCount, setReadCount] = useState(-1);
  const done = readCount >= DEMO_FILES.length;

  useEffect(() => {
    if (readCount < 0 || done) return;
    const t = window.setTimeout(() => setReadCount((c) => c + 1), 700);
    return () => window.clearTimeout(t);
  }, [readCount, done]);

  return (
    <div>
      <StepHeading
        headingRef={headingRef}
        title="Add your quotes"
        intro="Three suppliers quoted for the same box, each in a different format. Open any file to see what the original looks like."
      />

      <ul className="max-w-3xl divide-y divide-line rounded-lg border border-line-2">
        {DEMO_FILES.map((f, i) => {
          const Icon = KIND_ICON[f.kind];
          const status = readCount < 0 ? "waiting" : i < readCount ? "read" : i === readCount ? "reading" : "queued";
          return (
            <li key={f.quoteId} className="flex items-center gap-4 px-4 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-paper-2 text-ink-2">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-semibold text-ink hover:text-carbon hover:underline"
                >
                  {f.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <p className="text-[13px] text-ink-3">{f.description}</p>
              </div>
              <span className="shrink-0 text-[13px]" aria-live="polite">
                {status === "read" && (
                  <span className="inline-flex items-center gap-1 font-semibold text-stamp">
                    <Check className="size-4" aria-hidden /> Read
                  </span>
                )}
                {status === "reading" && (
                  <span className="inline-flex items-center gap-1.5 text-ink-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Reading
                  </span>
                )}
                {status === "queued" && <span className="text-ink-3">Queued</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-4 flex max-w-3xl items-center gap-3 rounded-lg border border-dashed border-line-2 px-4 py-4 text-[14px] text-ink-3"
        aria-disabled
      >
        <Upload className="size-5 shrink-0" aria-hidden />
        <p>Uploading your own quotes needs an account, which is coming soon. The demo uses these three files.</p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {done ? (
          <Button size="lg" onClick={onNext}>
            Check the numbers
          </Button>
        ) : (
          <Button size="lg" onClick={() => setReadCount(0)} disabled={readCount >= 0}>
            {readCount >= 0 ? "Reading quotes" : "Read these quotes"}
          </Button>
        )}
        <Button size="lg" variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Step 3: review ---------------- */

function ReviewStep({
  headingRef,
  setup,
  forms,
  onChange,
  onBack,
  onCompare,
}: {
  headingRef: HeadingRef;
  setup: SetupForm;
  forms: QuoteForm[];
  onChange: (f: QuoteForm[]) => void;
  onBack: () => void;
  onCompare: (r: ComparisonResult) => void;
}) {
  const [errors, setErrors] = useState<Record<string, FormErrors>>({});
  const toCheck = forms.reduce(
    (n, f) => n + Object.values(f.confidence).filter((c) => c != null && c < LOW_CONFIDENCE_THRESHOLD).length,
    0,
  );

  const compare = () => {
    const allErrors: Record<string, FormErrors> = {};
    const quotes = forms.flatMap((f) => {
      const r = formToQuoteInput(f);
      if (!r.ok) {
        allErrors[f.id] = r.errors;
        return [];
      }
      return [r.quote];
    });
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], .text-danger")?.scrollIntoView({ block: "center" }));
      return;
    }
    onCompare(
      compareQuotes({
        item_description: setup.item_description,
        unit: setup.unit,
        qty_needed: setupQty(setup),
        buyer_gst_registered: setup.buyer_gst_registered,
        as_of: todayInIndia(),
        required_by: setup.required_by || null,
        quotes,
      }),
    );
  };

  const errorCount = Object.values(errors).reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <div>
      <StepHeading
        headingRef={headingRef}
        title="Check the numbers"
        intro="Here's what we read from each quote, with the text it came from. Correct anything that's wrong; the comparison uses exactly what you confirm here."
      />
      {toCheck > 0 && (
        <p className="mb-6 max-w-[62ch] rounded-md bg-amber-2 px-4 py-3 text-[15px] text-amber">
          {toCheck === 1 ? "One value is" : `${toCheck} values are`} highlighted because we weren&rsquo;t sure we read
          {toCheck === 1 ? " it" : " them"} correctly. Check against the original, then press &ldquo;Looks right&rdquo; or
          correct it.
        </p>
      )}
      <div className="space-y-6">
        {forms.map((f, i) => {
          const file = DEMO_FILES.find((d) => d.quoteId === f.id);
          return (
            <QuoteReviewCard
              key={f.id}
              form={f}
              unit={setup.unit}
              errors={errors[f.id]}
              file={file && { name: file.name, href: file.href, kind: file.kind }}
              onChange={(next) => onChange(forms.map((x, j) => (j === i ? next : x)))}
            />
          );
        })}
      </div>
      {errorCount > 0 && (
        <p role="alert" className="mt-6 font-medium text-danger">
          Fix the {errorCount === 1 ? "highlighted field" : `${errorCount} highlighted fields`} to compare.
        </p>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" onClick={compare}>
          Compare quotes
        </Button>
        <Button size="lg" variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
