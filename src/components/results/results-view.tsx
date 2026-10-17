"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, ChevronDown, CircleAlert, Info } from "lucide-react";
import type { ComparisonResult, EngineWarning, QuoteResult } from "@/lib/engine/compare";
import { formatDate } from "@/lib/engine/compare";
import { formatINR, formatQty } from "@/lib/engine/money";
import { describeQuotedRate, singularUnit } from "@/lib/format";
import { buildRationale } from "@/lib/rationale/template";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<EngineWarning["severity"], { icon: typeof Info; className: string; label: string }> = {
  high: { icon: CircleAlert, className: "text-danger", label: "Important" },
  medium: { icon: AlertTriangle, className: "text-amber", label: "Check" },
  info: { icon: Info, className: "text-ink-3", label: "Note" },
};

export function ResultsView({ result, rationale }: { result: ComparisonResult; rationale?: string[] }) {
  const { input, results } = result;
  const best = results[0];
  const runnerUp = results[1];
  const unit = input.unit;
  const one = singularUnit(unit);
  const need = formatQty(result.qty_needed_milli);
  const paragraphs = rationale ?? buildRationale(result);
  const bestChecks = best.warnings.filter((w) => w.severity !== "info");
  const quoteOf = (id: string) => input.quotes.find((q) => q.id === id)!;

  return (
    <div className="space-y-12">
      <section aria-labelledby="recommendation" className="rounded-lg border-2 border-stamp bg-stamp-2/50 p-5 sm:p-7">
        <p className="text-sm font-semibold text-stamp">Lowest real cost</p>
        <h2 id="recommendation" className="mt-1 text-[1.9rem] leading-tight font-bold tracking-[-0.015em] text-ink">
          {best.supplier_name}
        </h2>
        <p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-ink">
          <span className="num font-semibold">{formatINR(best.effective_cost_paise)}</span> for {need} {unit}, or{" "}
          <span className="num font-semibold">{formatINR(best.effective_per_unit_paise)}</span> a {one}.
          {runnerUp && result.savings_vs_runner_up_paise > 0 && (
            <>
              {" "}
              That&rsquo;s <span className="num font-semibold">{formatINR(result.savings_vs_runner_up_paise)}</span> less
              than {runnerUp.supplier_name}.
            </>
          )}
        </p>
        {bestChecks.length > 0 && (
          <p className="mt-4 flex items-start gap-2 text-[15px] text-amber">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {bestChecks.length === 1 ? "One thing" : `${bestChecks.length} things`} to check before you order, listed below.
          </p>
        )}
      </section>

      <section aria-labelledby="ranking">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ranking" className="text-xl font-bold text-ink">
            Ranking
          </h2>
          <p className="text-sm text-ink-3">
            {input.buyer_gst_registered ? "GST-registered buyer" : "Buyer not GST-registered"}, {need} {unit} needed
          </p>
        </div>
        <RankingTable results={results} quoteOf={quoteOf} unit={unit} one={one} />
      </section>

      <section aria-labelledby="warnings">
        <h2 id="warnings" className="text-xl font-bold text-ink">
          Things to check
        </h2>
        <WarningsList results={results} />
      </section>

      <section aria-labelledby="why" className="max-w-[68ch]">
        <h2 id="why" className="text-xl font-bold text-ink">
          Why this ranking
        </h2>
        <div className="mt-3 space-y-3 leading-relaxed text-ink-2">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-3">Written from the calculated figures above; it adds no numbers of its own.</p>
      </section>
    </div>
  );
}

function RankingTable({
  results,
  quoteOf,
  unit,
  one,
}: {
  results: QuoteResult[];
  quoteOf: (id: string) => ComparisonResult["input"]["quotes"][number];
  unit: string;
  one: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(open === id ? null : id);
  return (
    <>
    {/* Phones: one stacked block per supplier so the real cost is never off-screen. */}
    <ol className="mt-4 divide-y divide-line rounded-lg border border-line-2 md:hidden">
      {results.map((r) => {
        const isOpen = open === r.quote_id;
        const best = r.rank === 1;
        return (
          <li key={r.quote_id} className={cn("px-4 py-4", best && "bg-stamp-2/40")}>
            <div className="flex items-baseline gap-3">
              <span className="num text-lg font-semibold text-ink-3">{r.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink">{r.supplier_name}</div>
                <div className="mt-0.5 text-[13px] text-ink-2">{describeQuotedRate(quoteOf(r.quote_id), unit)}</div>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 pl-7 text-[14px]">
              <div>
                <dt className="text-[12px] text-ink-3">Real cost</dt>
                <dd className={cn("num text-[17px] font-bold", best ? "text-stamp" : "text-ink")}>
                  {formatINR(r.effective_cost_paise)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-ink-3">Per {one}</dt>
                <dd className={cn("num text-[17px] font-semibold", best ? "text-stamp" : "text-ink")}>
                  {formatINR(r.effective_per_unit_paise)}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-ink-3">You pay (incl. GST)</dt>
                <dd className="num text-ink">{formatINR(r.cash_outlay_paise)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-ink-3">You buy</dt>
                <dd className="num text-ink">
                  {formatQty(r.purchase_qty_milli)}
                  {r.excess_qty_milli > 0 && (
                    <span className="block text-[12.5px] text-danger">+{formatQty(r.excess_qty_milli)} extra</span>
                  )}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => toggle(r.quote_id)}
              aria-expanded={isOpen}
              className="mt-3 ml-7 inline-flex items-center gap-1 text-[13px] font-semibold text-carbon hover:underline"
            >
              {isOpen ? "Hide working" : "Show working"}
              <ChevronDown className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} aria-hidden />
            </button>
            {isOpen && (
              <div className="mt-2 pl-7">
                <Working r={r} unit={unit} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
    <div className="mt-4 hidden overflow-x-auto rounded-lg border border-line-2 md:block">
      <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
        <thead className="bg-paper-2 text-xs font-medium text-ink-3">
          <tr>
            <th scope="col" className="w-10 py-3 pl-4">
              <span className="sr-only">Rank</span>
            </th>
            <th scope="col" className="py-3 pr-3">Supplier</th>
            <th scope="col" className="py-3 pr-3 text-right">You buy</th>
            <th scope="col" className="py-3 pr-3 text-right">You pay (incl. GST)</th>
            <th scope="col" className="py-3 pr-3 text-right">GST credit</th>
            <th scope="col" className="py-3 pr-3 text-right">Real cost</th>
            <th scope="col" className="py-3 pr-4 text-right">Per {one}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const isOpen = open === r.quote_id;
            const q = quoteOf(r.quote_id);
            return (
              <Fragment key={r.quote_id}>
                <tr className={cn("border-t border-line align-top", r.rank === 1 && "bg-stamp-2/40")}>
                  <td className="num py-4 pl-4 text-lg font-semibold text-ink-3">{r.rank}</td>
                  <td className="py-4 pr-3">
                    <div className="font-semibold text-ink">{r.supplier_name}</div>
                    <div className="mt-0.5 text-[13px] text-ink-2">{describeQuotedRate(q, unit)}</div>
                    <button
                      type="button"
                      onClick={() => toggle(r.quote_id)}
                      aria-expanded={isOpen}
                      className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-carbon hover:underline"
                    >
                      {isOpen ? "Hide working" : "Show working"}
                      <ChevronDown className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} aria-hidden />
                    </button>
                  </td>
                  <td className="num py-4 pr-3 text-right text-ink">
                    {formatQty(r.purchase_qty_milli)}
                    {r.excess_qty_milli > 0 && (
                      <div className="text-[13px] text-danger">+{formatQty(r.excess_qty_milli)} extra</div>
                    )}
                  </td>
                  <td className="num py-4 pr-3 text-right text-ink">{formatINR(r.cash_outlay_paise)}</td>
                  <td className="num py-4 pr-3 text-right text-ink-2">
                    {r.gst_credit_paise > 0 ? `−${formatINR(r.gst_credit_paise)}` : "None"}
                  </td>
                  <td className={cn("num py-4 pr-3 text-right font-bold", r.rank === 1 ? "text-stamp" : "text-ink")}>
                    {formatINR(r.effective_cost_paise)}
                  </td>
                  <td className={cn("num py-4 pr-4 text-right font-semibold", r.rank === 1 ? "text-stamp" : "text-ink")}>
                    {formatINR(r.effective_per_unit_paise)}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-line bg-paper-2/60">
                    <td />
                    <td colSpan={6} className="py-4 pr-4">
                      <Working r={r} unit={unit} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}

function Working({ r, unit }: { r: QuoteResult; unit: string }) {
  const rows: [string, string][] = [
    [`Quantity bought`, `${formatQty(r.purchase_qty_milli)} ${unit}`],
    [`Goods value before GST (${formatINR(r.unit_price_ex_gst_paise)} each)`, formatINR(r.goods_ex_gst_paise)],
    ["Freight", formatINR(r.freight_paise)],
    ["Other charges", formatINR(r.other_charges_paise)],
    ["Subtotal before GST", formatINR(r.subtotal_ex_gst_paise)],
    [`GST at ${r.gst_rate_percent}%${r.gst_rate_assumed ? " (assumed)" : ""}`, formatINR(r.gst_paise)],
    ["You pay the supplier", formatINR(r.cash_outlay_paise)],
    [
      r.gst_credit_eligible ? "Less GST claimed back as input tax credit" : "GST credit (not claimable)",
      r.gst_credit_eligible ? `−${formatINR(r.gst_credit_paise)}` : formatINR(0),
    ],
  ];
  return (
    <dl className="max-w-xl text-[14px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-6 border-b border-line py-1.5">
          <dt className="text-ink-2">{k}</dt>
          <dd className="num text-ink">{v}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-6 py-2 font-bold">
        <dt className="text-ink">Real cost</dt>
        <dd className="num text-ink">{formatINR(r.effective_cost_paise)}</dd>
      </div>
      {r.excess_qty_milli > 0 && (
        <div className="flex justify-between gap-6 py-1 text-danger">
          <dt>
            Of which, {formatQty(r.excess_qty_milli)} {unit} you don&rsquo;t need
          </dt>
          <dd className="num">{formatINR(r.excess_value_paise)}</dd>
        </div>
      )}
      {r.delivery_date && (
        <div className="flex justify-between gap-6 py-1 text-ink-2">
          <dt>Expected delivery</dt>
          <dd>{formatDate(r.delivery_date)}</dd>
        </div>
      )}
    </dl>
  );
}

function WarningsList({ results }: { results: QuoteResult[] }) {
  const withWarnings = results.filter((r) => r.warnings.length > 0);
  if (withWarnings.length === 0) {
    return <p className="mt-3 text-ink-2">Nothing flagged. All quotes have the details needed for a fair comparison.</p>;
  }
  return (
    <div className="mt-4 space-y-6">
      {withWarnings.map((r) => (
        <div key={r.quote_id}>
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            {r.supplier_name}
            <Badge variant="outline">Rank {r.rank}</Badge>
          </h3>
          <ul className="mt-2 space-y-2">
            {r.warnings.map((w) => {
              const s = SEVERITY_STYLE[w.severity];
              const Icon = s.icon;
              return (
                <li key={w.code + w.message} className="flex max-w-[72ch] gap-2.5 leading-relaxed text-ink-2">
                  <Icon className={cn("mt-1 size-4 shrink-0", s.className)} aria-hidden />
                  <span>
                    <span className="sr-only">{s.label}: </span>
                    {w.message}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
