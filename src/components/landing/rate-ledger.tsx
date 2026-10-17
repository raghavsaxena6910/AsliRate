"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR, formatQty } from "@/lib/engine/money";
import { SAMPLE_UNIT, sampleComparison } from "@/lib/demo/sample-quotes";
import { describeQuotedRate, quotedUnitPrice } from "@/lib/format";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

type Mode = "quoted" | "asli";

const ROW_H = 88;

/** Engine output for the three sample suppliers, computed once. */
function useLedgerRows() {
  return useMemo(() => {
    const result = compareQuotes(sampleComparison("2026-10-17"));
    return result.input.quotes.map((q) => {
      const r = result.results.find((x) => x.quote_id === q.id)!;
      let reason: string;
      if (r.excess_qty_milli > 0) {
        reason = `Minimum order ${formatQty(r.purchase_qty_milli)}: you pay for ${formatQty(r.excess_qty_milli)} ${SAMPLE_UNIT} you don't need`;
      } else if (q.gst_treatment === "included" && r.gst_credit_eligible) {
        reason = `Includes ${formatINR(r.gst_paise)} GST you claim back`;
      } else if (r.freight_paise > 0) {
        reason = `${formatINR(r.freight_paise)} freight on top`;
      } else {
        reason = "No extra costs";
      }
      return {
        id: q.id,
        name: q.supplier_name,
        quotedAs: describeQuotedRate(q, SAMPLE_UNIT),
        quoted: formatINR(q.unit_price_paise),
        quotedSort: quotedUnitPrice(q),
        asli: formatINR(r.effective_per_unit_paise),
        asliRank: r.rank,
        reason,
      };
    });
  }, []);
}

export function RateLedger() {
  const rows = useLedgerRows();
  const [mode, setMode] = useState<Mode>("quoted");
  // The mode whose re-sort animation has finished; the stamp lands after that.
  const [settledMode, setSettledMode] = useState<Mode | null>(null);
  const settled = mode === "asli" && settledMode === "asli";
  const touched = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flip = window.setTimeout(
      () => {
        if (!touched.current) setMode("asli");
      },
      reduced ? 0 : 1600,
    );
    return () => window.clearTimeout(flip);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setSettledMode(mode), 650);
    return () => window.clearTimeout(t);
  }, [mode]);

  const order = useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      mode === "quoted" ? a.quotedSort - b.quotedSort : a.asliRank - b.asliRank,
    );
    return new Map(sorted.map((r, i) => [r.id, i]));
  }, [rows, mode]);

  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-lg border border-line-2 bg-white shadow-[0_1px_0_var(--line),0_12px_32px_-16px_rgba(22,32,46,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper-2 px-4 py-3">
          <p className="text-sm font-semibold text-ink">5,000 shipping boxes, three quotes</p>
          <Segmented
            aria-label="Sort suppliers by"
            value={mode}
            onValueChange={(v) => {
              touched.current = true;
              setMode(v);
            }}
            options={[
              { value: "quoted", label: "As quoted" },
              { value: "asli", label: "Asli rate" },
            ]}
            className="w-auto"
          />
        </div>

        <div className="grid grid-cols-[2.25rem_1fr_4.5rem_4.75rem] items-end gap-x-3 border-b border-line px-4 pt-3 pb-2 text-xs font-medium text-ink-3 sm:grid-cols-[2.5rem_1fr_5.5rem_5.5rem]">
          <span className="sr-only">Rank</span>
          <span className="col-start-2">Supplier</span>
          <span className={cn("text-right transition-colors", mode === "quoted" && "text-ink")}>Quoted / box</span>
          <span className={cn("text-right transition-colors", mode === "asli" && "text-stamp")}>Asli rate / box</span>
        </div>

        <ol className="relative" style={{ height: ROW_H * rows.length }} aria-live="polite">
          {/* The bill-book margin rule. */}
          <span aria-hidden className="absolute inset-y-0 left-[3.1rem] w-px bg-margin-rule sm:left-[3.4rem]" />
          {rows.map((row) => {
            const pos = order.get(row.id)!;
            const isWinner = mode === "asli" && row.asliRank === 1;
            return (
              <li
                key={row.id}
                className="absolute inset-x-0 grid grid-cols-[2.25rem_1fr_4.5rem_4.75rem] items-center gap-x-3 border-b border-line px-4 transition-transform duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)] last:border-b-0 sm:grid-cols-[2.5rem_1fr_5.5rem_5.5rem]"
                style={{ height: ROW_H, transform: `translateY(${pos * ROW_H}px)` }}
              >
                <span className="num text-[22px] font-semibold text-ink-3">{pos + 1}</span>
                <span className="min-w-0 pl-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{row.name}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">
                    {mode === "quoted" ? row.quotedAs : row.reason}
                  </span>
                </span>
                <span
                  className={cn(
                    "num text-right text-[15px] transition-colors",
                    mode === "quoted" ? "font-semibold text-ink" : "text-ink-3 line-through decoration-ink-3/50",
                  )}
                >
                  {row.quoted}
                </span>
                <span
                  className={cn(
                    "num text-right text-[17px] font-bold transition-colors",
                    mode === "asli" ? (isWinner ? "text-stamp" : "text-ink") : "text-ink-3",
                  )}
                >
                  {row.asli}
                </span>
                {isWinner && (
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute top-1.5 right-3 hidden -rotate-[6deg] rounded-md border-2 border-stamp px-2 py-0.5 text-[11px] leading-tight font-bold text-stamp transition-all duration-200 sm:block",
                      settled ? "scale-100 opacity-90" : "scale-150 opacity-0",
                    )}
                  >
                    Lowest real cost
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-ink-3">
        Buyer is GST-registered; boxes carry 18% GST. Asli rate counts GST credit, freight and minimum order, divided by the
        5,000 boxes you need.
      </figcaption>
    </figure>
  );
}
