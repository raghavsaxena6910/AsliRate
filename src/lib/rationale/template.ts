import type { ComparisonResult, QuoteResult } from "@/lib/engine/compare";
import { formatINR, formatQty } from "@/lib/engine/money";
import type { ParsedQuote } from "@/lib/engine/schema";
import { quotedUnitPrice, singularUnit } from "@/lib/format";

/**
 * Plain-English explanation of a ranking, assembled only from engine output.
 * Used in demo mode and as the fallback if the AI explanation is unavailable.
 * It never calculates a rupee figure itself — every amount is read from the
 * engine result (the only arithmetic is the engine's own differences).
 */
export function buildRationale(result: ComparisonResult): string[] {
  const { input, results } = result;
  const unit = input.unit;
  const one = singularUnit(unit);
  const quote = (id: string) => input.quotes.find((q) => q.id === id)!;
  const best = results[0];
  const bestQuote = quote(best.quote_id);
  const need = formatQty(result.qty_needed_milli);

  const paras: string[] = [];

  let opening = `${best.supplier_name} is the lowest real cost: ${formatINR(best.effective_cost_paise)} for ${need} ${unit}, or ${formatINR(best.effective_per_unit_paise)} a ${one}.`;
  const cheapestSticker = [...input.quotes].sort((a, b) => quotedUnitPrice(a) - quotedUnitPrice(b))[0];
  if (cheapestSticker.id !== best.quote_id && results.length > 1) {
    opening += ` That's despite ${cheapestSticker.supplier_name} quoting the lowest rate on paper.`;
  }
  paras.push(opening);

  const why = explainQuote(best, bestQuote, input.buyer_gst_registered);
  if (why) paras.push(why);

  for (const r of results.slice(1)) {
    const gap = r.difference_from_best_paise;
    const reason = explainQuote(r, quote(r.quote_id), input.buyer_gst_registered);
    paras.push(
      gap === 0
        ? `${r.supplier_name} costs exactly the same as ${best.supplier_name}; ties are ranked by shorter delivery time.${reason ? ` ${reason}` : ""}`
        : `${r.supplier_name} costs ${formatINR(gap)} more in real terms (${formatINR(r.effective_cost_paise)}).${reason ? ` ${reason}` : ""}`,
    );
  }

  const checks = best.warnings.filter((w) => w.severity !== "info");
  if (checks.length > 0) {
    paras.push(`Before you order from ${best.supplier_name}: ${checks.map((w) => w.message).join(" ")}`);
  }
  return paras;
}

function explainQuote(r: QuoteResult, q: ParsedQuote, buyerRegistered: boolean): string {
  const bits: string[] = [];
  if (r.excess_qty_milli > 0) {
    bits.push(
      `You'd have to buy ${formatQty(r.purchase_qty_milli)}, so ${formatQty(r.excess_qty_milli)} extra worth ${formatINR(r.excess_value_paise)} sit in stock.`,
    );
  }
  if (r.freight_paise > 0) bits.push(`Freight adds ${formatINR(r.freight_paise)}.`);
  if (r.gst_credit_eligible && r.gst_credit_paise > 0) {
    bits.push(
      q.gst_treatment === "included"
        ? `The quoted price already includes ${formatINR(r.gst_paise)} of GST, which you can claim back as input tax credit.`
        : `The ${formatINR(r.gst_paise)} GST is claimable as input tax credit, so it isn't counted as cost.`,
    );
  } else if (r.gst_paise > 0) {
    bits.push(
      buyerRegistered
        ? `The ${formatINR(r.gst_paise)} GST can't be claimed back without a GSTIN or proper tax invoice, so it counts as cost.`
        : `As you're not GST-registered, the ${formatINR(r.gst_paise)} GST is part of your cost.`,
    );
  }
  return bits.join(" ");
}
