import { formatDate } from "@/lib/engine/compare";
import { formatQty, toMilli } from "@/lib/engine/money";
import type { ComparisonRow } from "@/lib/comparisons/queries";
import { cn } from "@/lib/utils";

/** One-line reminder of what's being bought, shown above each step. */
export function ComparisonSummary({ comparison: c, className }: { comparison: ComparisonRow; className?: string }) {
  const bits = [
    `${formatQty(toMilli(c.qty_needed))} ${c.unit}`,
    c.required_by ? `needed by ${formatDate(c.required_by)}` : null,
    c.buyer_gst_registered ? "GST-registered buyer" : "not GST-registered",
  ].filter(Boolean);
  return (
    <div className={cn("rounded-xl border border-line bg-paper-2 px-4 py-3", className)}>
      <p className="font-semibold text-ink">
        {c.item_description}
        {c.specification ? <span className="font-normal text-ink-2">, {c.specification}</span> : null}
      </p>
      <p className="text-sm text-ink-3">{bits.join(" · ")}</p>
    </div>
  );
}
