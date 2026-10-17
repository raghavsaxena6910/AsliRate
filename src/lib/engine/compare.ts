import {
  QTY_SCALE,
  divCeil,
  divRound,
  formatINR,
  formatQty,
  toMilli,
  toSafeNumber,
  type Milli,
  type Paise,
} from "./money";
import {
  GSTIN_PATTERN,
  QUOTE_FIELD_LABELS,
  comparisonInputSchema,
  type ComparisonInput,
  type ParsedComparison,
  type ParsedQuote,
  type QuoteField,
} from "./schema";

/**
 * AsliRate calculation engine.
 *
 * Deterministic and pure: same input → same output. No AI, no I/O, no clock
 * (the comparison date is passed in as `as_of`). Every rupee shown anywhere in
 * the app — including in AI-written explanations — must come from here.
 */

export const DEFAULT_GST_RATE_PERCENT = 18;
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

export type WarningCode =
  | "MOQ_ABOVE_NEED"
  | "PACK_SIZE_ROUNDUP"
  | "GST_INCLUDED_NO_GSTIN"
  | "GSTIN_INVALID"
  | "FREIGHT_MISSING"
  | "GST_RATE_ASSUMED"
  | "QUOTE_EXPIRED"
  | "LEAD_TIME_MISSES_DEADLINE"
  | "NOT_LIKE_FOR_LIKE"
  | "LOW_CONFIDENCE";

export type WarningSeverity = "high" | "medium" | "info";

export interface EngineWarning {
  code: WarningCode;
  severity: WarningSeverity;
  message: string;
  fields?: QuoteField[];
}

export interface QuoteResult {
  quote_id: string;
  supplier_name: string;
  rank: number;
  /** Quantity actually bought after MOQ and pack-size rules (milli-units). */
  purchase_qty_milli: Milli;
  excess_qty_milli: Milli;
  gst_rate_percent: number;
  gst_rate_assumed: boolean;
  /** Ex-GST price of one unit, rounded to paise — for display only. */
  unit_price_ex_gst_paise: Paise;
  goods_ex_gst_paise: Paise;
  freight_paise: Paise;
  other_charges_paise: Paise;
  subtotal_ex_gst_paise: Paise;
  gst_paise: Paise;
  cash_outlay_paise: Paise;
  /** True when the buyer can claim the GST back as input tax credit. */
  gst_credit_eligible: boolean;
  gst_credit_paise: Paise;
  /** What this quote really costs the buyer: subtotal if GST is claimable, else cash outlay. */
  effective_cost_paise: Paise;
  /** Effective cost ÷ quantity needed, rounded to paise. */
  effective_per_unit_paise: Paise;
  /** Value of the units bought beyond what's needed. */
  excess_value_paise: Paise;
  /** Effective cost above the rank-1 quote (0 for rank 1). */
  difference_from_best_paise: Paise;
  delivery_date: string | null;
  warnings: EngineWarning[];
}

export interface ComparisonResult {
  input: ParsedComparison;
  results: QuoteResult[];
  recommended_quote_id: string;
  /** Effective-cost gap between rank 1 and rank 2 (0 if only one quote). */
  savings_vs_runner_up_paise: Paise;
  qty_needed_milli: Milli;
  currency: "INR";
}

/* ---------------- date helpers (UTC, YYYY-MM-DD) ---------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}
function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function formatDate(iso: string): string {
  const d = parseDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/* ---------------- per-quote calculation ---------------- */

function calculateQuote(
  q: ParsedQuote,
  c: ParsedComparison,
): Omit<QuoteResult, "rank" | "difference_from_best_paise"> {
  const warnings: EngineWarning[] = [];
  const unit = c.unit;
  const needMilli = toMilli(c.qty_needed);

  // 1. Purchase quantity: at least the MOQ, rounded up to whole packs.
  const moqMilli = q.moq != null ? toMilli(q.moq) : 0;
  const baseMilli = Math.max(needMilli, moqMilli);
  let purchaseMilli = baseMilli;
  if (q.pack_size != null) {
    const pack = BigInt(toMilli(q.pack_size));
    purchaseMilli = toSafeNumber(divCeil(BigInt(baseMilli), pack) * pack);
  }
  const excessMilli = purchaseMilli - needMilli;

  // 2. GST rate (basis points: 18% → 1800).
  const rateAssumed = q.gst_rate_percent == null;
  const ratePercent = q.gst_rate_percent ?? DEFAULT_GST_RATE_PERCENT;
  const rateBp = BigInt(Math.round(ratePercent * 100));
  if (rateAssumed) {
    warnings.push({
      code: "GST_RATE_ASSUMED",
      severity: "medium",
      message: `The quote doesn't state a GST rate, so we've assumed ${DEFAULT_GST_RATE_PERCENT}%. Confirm the rate with the supplier.`,
      fields: ["gst_rate_percent"],
    });
  }

  // 3. Goods value ex-GST. One rounding step at the end keeps paise exact.
  const price = BigInt(q.unit_price_paise);
  const basisMilli = BigInt(toMilli(q.price_basis));
  const purchase = BigInt(purchaseMilli);
  let goods: bigint;
  let unitExGst: bigint;
  if (q.gst_treatment === "included") {
    goods = divRound(price * purchase * 10000n, basisMilli * (10000n + rateBp));
    unitExGst = divRound(price * BigInt(QTY_SCALE) * 10000n, basisMilli * (10000n + rateBp));
  } else {
    goods = divRound(price * purchase, basisMilli);
    unitExGst = divRound(price * BigInt(QTY_SCALE), basisMilli);
  }

  // 4. Freight and other charges (ex-GST).
  let freight = 0n;
  if (q.freight_treatment === "extra") {
    if (q.freight_paise == null) {
      warnings.push({
        code: "FREIGHT_MISSING",
        severity: "medium",
        message: "Freight is charged extra but no amount is given. We've counted ₹0 — ask the supplier for the freight cost.",
        fields: ["freight_paise"],
      });
    } else {
      freight = BigInt(q.freight_paise);
    }
  } else if (q.freight_treatment === "not_mentioned") {
    warnings.push({
      code: "FREIGHT_MISSING",
      severity: "medium",
      message: "The quote doesn't say whether freight is included. We've counted ₹0 — confirm with the supplier.",
      fields: ["freight_treatment"],
    });
  }
  const other = q.other_charges.reduce((sum, ch) => sum + BigInt(ch.amount_paise), 0n);

  // 5. Subtotal, GST, cash outlay.
  const subtotal = goods + freight + other;
  const gst = divRound(subtotal * rateBp, 10000n);
  const cash = subtotal + gst;

  // 6. Input tax credit: buyer registered AND (valid GSTIN OR tax invoice confirmed).
  const gstinPresent = q.supplier_gstin != null && q.supplier_gstin !== "";
  const gstinValid = gstinPresent && GSTIN_PATTERN.test(q.supplier_gstin!);
  if (gstinPresent && !gstinValid) {
    warnings.push({
      code: "GSTIN_INVALID",
      severity: "medium",
      message: `"${q.supplier_gstin}" doesn't look like a valid GSTIN (15 characters, e.g. 06ABCDE1234F1Z5). We haven't treated it as a GSTIN.`,
      fields: ["supplier_gstin"],
    });
  }
  const creditEligible = c.buyer_gst_registered && (gstinValid || q.tax_invoice_confirmed);
  const effective = creditEligible ? subtotal : cash;

  if (q.gst_treatment === "included" && !gstinValid && !q.tax_invoice_confirmed) {
    warnings.push({
      code: "GST_INCLUDED_NO_GSTIN",
      severity: "high",
      message: c.buyer_gst_registered
        ? `The price includes GST but the quote shows no supplier GSTIN. Without a proper tax invoice you can't claim the ${formatINR(gst)} GST back, so we've counted it as cost.`
        : "The price includes GST but the quote shows no supplier GSTIN. Ask for the GSTIN and a proper tax invoice.",
      fields: ["supplier_gstin"],
    });
  }

  // 7. Per-unit and excess.
  const need = BigInt(needMilli);
  const perUnit = divRound(effective * BigInt(QTY_SCALE), need);
  const excessValue = excessMilli > 0 ? divRound(BigInt(excessMilli) * effective, purchase) : 0n;

  if (moqMilli > needMilli) {
    warnings.push({
      code: "MOQ_ABOVE_NEED",
      severity: "high",
      message: `Minimum order is ${formatQty(moqMilli)} ${unit} but you need ${formatQty(needMilli)}. You'd buy ${formatQty(excessMilli)} extra worth ${formatINR(excessValue)}.`,
      fields: ["moq"],
    });
  }
  if (purchaseMilli > baseMilli) {
    warnings.push({
      code: "PACK_SIZE_ROUNDUP",
      severity: "info",
      message: `Sold in packs of ${formatQty(toMilli(q.pack_size!))}, so you'd buy ${formatQty(purchaseMilli)} ${unit} instead of ${formatQty(baseMilli)}.`,
      fields: ["pack_size"],
    });
  }

  // 8. Dates.
  if (q.valid_until != null && q.valid_until < c.as_of) {
    warnings.push({
      code: "QUOTE_EXPIRED",
      severity: "high",
      message: `This quote expired on ${formatDate(q.valid_until)}. Ask the supplier to reconfirm the price.`,
      fields: ["valid_until"],
    });
  }
  const deliveryDate = q.lead_time_days != null ? addDays(c.as_of, q.lead_time_days) : null;
  if (deliveryDate != null && c.required_by != null && deliveryDate > c.required_by) {
    warnings.push({
      code: "LEAD_TIME_MISSES_DEADLINE",
      severity: "high",
      message: `Delivery in ${q.lead_time_days} days lands around ${formatDate(deliveryDate)}, after your required-by date of ${formatDate(c.required_by)}.`,
      fields: ["lead_time_days"],
    });
  }

  // 9. Like-for-like and extraction confidence.
  if (!q.like_for_like) {
    warnings.push({
      code: "NOT_LIKE_FOR_LIKE",
      severity: "high",
      message: q.like_for_like_note
        ? `Not the same item: ${q.like_for_like_note}`
        : "This quote isn't for exactly the same item, so the price comparison may not be fair.",
      fields: ["item_description"],
    });
  }
  const lowFields = (Object.entries(q.field_confidence) as [QuoteField, number][])
    .filter(([, conf]) => conf < LOW_CONFIDENCE_THRESHOLD)
    .map(([field]) => field);
  if (lowFields.length > 0) {
    warnings.push({
      code: "LOW_CONFIDENCE",
      severity: "medium",
      message: `We weren't sure we read these correctly: ${lowFields.map((f) => QUOTE_FIELD_LABELS[f]).join(", ")}. Please double-check them against the quote.`,
      fields: lowFields,
    });
  }

  return {
    quote_id: q.id,
    supplier_name: q.supplier_name,
    purchase_qty_milli: purchaseMilli,
    excess_qty_milli: excessMilli,
    gst_rate_percent: ratePercent,
    gst_rate_assumed: rateAssumed,
    unit_price_ex_gst_paise: toSafeNumber(unitExGst),
    goods_ex_gst_paise: toSafeNumber(goods),
    freight_paise: toSafeNumber(freight),
    other_charges_paise: toSafeNumber(other),
    subtotal_ex_gst_paise: toSafeNumber(subtotal),
    gst_paise: toSafeNumber(gst),
    cash_outlay_paise: toSafeNumber(cash),
    gst_credit_eligible: creditEligible,
    gst_credit_paise: creditEligible ? toSafeNumber(gst) : 0,
    effective_cost_paise: toSafeNumber(effective),
    effective_per_unit_paise: toSafeNumber(perUnit),
    excess_value_paise: toSafeNumber(excessValue),
    delivery_date: deliveryDate,
    warnings,
  };
}

/* ---------------- comparison ---------------- */

export function compareQuotes(raw: ComparisonInput): ComparisonResult {
  const input = comparisonInputSchema.parse(raw);
  const calculated = input.quotes.map((q, index) => ({ index, lead: q.lead_time_days, r: calculateQuote(q, input) }));

  // Every quote shares the same quantity needed, so ranking by effective cost
  // per unit needed is the same as ranking by effective cost. Comparing the
  // exact paise totals avoids per-unit rounding ties.
  calculated.sort((a, b) => {
    if (a.r.effective_cost_paise !== b.r.effective_cost_paise) {
      return a.r.effective_cost_paise - b.r.effective_cost_paise;
    }
    const la = a.lead ?? Number.POSITIVE_INFINITY;
    const lb = b.lead ?? Number.POSITIVE_INFINITY;
    if (la !== lb) return la - lb;
    return a.index - b.index;
  });

  const bestCost = calculated[0].r.effective_cost_paise;
  const results: QuoteResult[] = calculated.map((c, i) => ({
    ...c.r,
    rank: i + 1,
    difference_from_best_paise: c.r.effective_cost_paise - bestCost,
  }));
  const savings = results.length > 1 ? results[1].effective_cost_paise - results[0].effective_cost_paise : 0;

  return {
    input,
    results,
    recommended_quote_id: results[0].quote_id,
    savings_vs_runner_up_paise: savings,
    qty_needed_milli: toMilli(input.qty_needed),
    currency: "INR",
  };
}
