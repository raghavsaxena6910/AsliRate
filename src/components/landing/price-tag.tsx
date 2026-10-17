import { compareQuotes } from "@/lib/engine/compare";
import { formatINR, formatQty } from "@/lib/engine/money";
import { sampleComparison } from "@/lib/demo/sample-quotes";

/**
 * The logo's price tag, used to show one quote's journey from sticker price
 * to real rate. Every figure is read from the engine's result for supplier C.
 */
export function PriceTag() {
  const result = compareQuotes(sampleComparison("2026-10-17"));
  const c = result.results.find((r) => r.quote_id === "C")!;
  const q = result.input.quotes.find((x) => x.id === "C")!;
  const need = formatQty(result.qty_needed_milli);

  const lines: { label: string; note?: string; value: string; tone?: "muted" | "credit" }[] = [
    {
      label: `${formatQty(c.purchase_qty_milli)} boxes at ${formatINR(q.unit_price_paise)}`,
      note: `Minimum order is ${formatQty(c.purchase_qty_milli)}; you need ${need}`,
      value: formatINR(c.goods_ex_gst_paise),
    },
    { label: "Freight to Gurugram", value: formatINR(c.freight_paise) },
    { label: `GST at ${c.gst_rate_percent}%`, value: formatINR(c.gst_paise), tone: "muted" },
    { label: "GST claimed back as input tax credit", value: `−${formatINR(c.gst_credit_paise)}`, tone: "credit" },
  ];

  return (
    <figure className="relative mx-auto w-full max-w-[460px]">
      {/* String to the tag's hole */}
      <svg
        aria-hidden
        viewBox="0 0 120 70"
        className="absolute -top-14 left-1/2 h-16 w-28 -translate-x-1/2 text-brand"
        fill="none"
      >
        <path d="M60 68 C 58 40, 30 30, 12 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div
        className="relative rotate-[-1deg] rounded-[28px] border-2 border-brand bg-white px-6 pt-12 pb-6 shadow-[0_24px_48px_-28px_rgba(5,77,39,0.55)] sm:px-8"
      >
        <span
          aria-hidden
          className="absolute top-5 left-1/2 size-5 -translate-x-1/2 rounded-full border-2 border-brand bg-paper-2"
        />
        <p className="text-center text-sm font-semibold text-ink-3">{q.supplier_name} quoted</p>
        <p className="num text-center text-[2.6rem] leading-tight font-extrabold tracking-[-0.03em] text-ink-3 line-through decoration-2 decoration-ink-3/40">
          {formatINR(q.unit_price_paise)}
          <span className="text-lg font-semibold"> a box</span>
        </p>

        <dl className="mt-5 border-t border-dashed border-line-2 pt-3 text-[14.5px]">
          {lines.map((l) => (
            <div key={l.label} className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className={l.tone ? "text-ink-3" : "text-ink-2"}>
                {l.label}
                {l.note && <span className="block text-[12.5px] text-amber">{l.note}</span>}
              </dt>
              <dd className={`num shrink-0 ${l.tone === "credit" ? "text-brand" : l.tone ? "text-ink-3" : "text-ink"}`}>
                {l.value}
              </dd>
            </div>
          ))}
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3 font-semibold text-ink">
            <dt>Real cost of the order</dt>
            <dd className="num">{formatINR(c.effective_cost_paise)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-2xl bg-brand-2 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-brand-deep">
            Asli rate, for the {need} you need
          </p>
          <p className="num text-[2.6rem] leading-tight font-extrabold tracking-[-0.03em] text-brand-deep">
            {formatINR(c.effective_per_unit_paise)}
            <span className="text-lg font-semibold"> a box</span>
          </p>
        </div>
      </div>
      <figcaption className="mt-5 text-center text-[13px] text-ink-3">
        From the sample quotes in the demo. Buyer is GST-registered.
      </figcaption>
    </figure>
  );
}
