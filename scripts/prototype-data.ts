/**
 * Computes every figure shown in prototype/aslirate-prototype.html from the
 * real engine, so the prototype never shows a hand-typed number.
 *
 *   npx tsx scripts/prototype-data.ts > prototype/data.json
 *
 * Payment-terms financing cost and the scorecard below are PROPOSED rules for
 * the report; they move into src/lib/engine (with tests) when we build them.
 */
import { compareQuotes, type ComparisonResult } from "../src/lib/engine/compare";
import { formatINR, formatQty, divRound } from "../src/lib/engine/money";
import { sampleComparison } from "../src/lib/demo/sample-quotes";

const AS_OF = "2026-10-17";
const REQUIRED_BY = "2026-11-05";
const COST_OF_FUNDS_PCT = 12; // buyer's cost of money, % per year (set on company profile)

/** Payment terms read from the sample quotes. */
const TERMS: Record<string, { label: string; advancePct: number; creditDays: number; stated: boolean }> = {
  A: { label: "50% advance with PO, balance on delivery", advancePct: 50, creditDays: 0, stated: true },
  B: { label: "Not stated (assumed payment on delivery)", advancePct: 0, creditDays: 0, stated: false },
  C: { label: "30 days credit from invoice", advancePct: 0, creditDays: 30, stated: true },
};

/** Which key terms each quote states: price, GST, freight, MOQ, lead time, validity, payment. */
const STATED: Record<string, boolean[]> = {
  A: [true, true, true, true, true, true, true],
  B: [true, true, true, false, true, false, false],
  C: [true, true, true, true, true, true, true],
};
const FORMAL_DOC: Record<string, boolean> = { A: true, B: false, C: true };

const base = compareQuotes(sampleComparison(AS_OF, { required_by: REQUIRED_BY }));

/**
 * Financing cost vs paying on the delivery day. Advance money is locked up for
 * the lead time; credit days give money back. On cash outlay (GST included),
 * because that is the cash that moves.
 */
function financing(r: ComparisonResult["results"][number]): number {
  const t = TERMS[r.quote_id];
  const cash = BigInt(r.cash_outlay_paise);
  const rateBp = BigInt(COST_OF_FUNDS_PCT * 100);
  const lead = BigInt(base.input.quotes.find((q) => q.id === r.quote_id)!.lead_time_days ?? 0);
  const advance = divRound(cash * BigInt(t.advancePct) * rateBp * lead, 100n * 10000n * 365n);
  const credit = divRound(cash * rateBp * BigInt(t.creditDays), 10000n * 365n);
  return Number(advance - credit);
}

const rows = base.results.map((r) => {
  const q = base.input.quotes.find((x) => x.id === r.quote_id)!;
  const fin = financing(r);
  return { r, q, fin, total: r.effective_cost_paise + fin };
});
const bestTotal = Math.min(...rows.map((x) => x.total));
const minLead = Math.min(...rows.map((x) => x.q.lead_time_days ?? 999));

/** Scorecard: each criterion 0–100 by fixed rules; overall is the weighted sum. */
const WEIGHTS = { cost: 50, delivery: 15, terms: 10, compliance: 10, completeness: 10, fit: 5 };
function termsScore(id: string) {
  const t = TERMS[id];
  if (!t.stated) return 50;
  if (t.creditDays >= 30) return 100;
  if (t.creditDays > 0) return 80;
  if (t.advancePct === 0) return 60;
  return t.advancePct >= 100 ? 20 : 40;
}
const scored = rows.map((x) => {
  const id = x.r.quote_id;
  const s = {
    cost: Math.round((100 * bestTotal) / x.total),
    delivery: x.q.lead_time_days == null ? 50 : Math.round((100 * minLead) / x.q.lead_time_days),
    terms: termsScore(id),
    compliance: (x.r.gst_credit_eligible ? 80 : 30) + (FORMAL_DOC[id] ? 20 : 0),
    completeness: Math.round((100 * STATED[id].filter(Boolean).length) / STATED[id].length),
    fit: 60, // neutral until the user rates past experience
  };
  const overall =
    Math.round(
      (Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][]).reduce((sum, [k, w]) => sum + s[k] * w, 0) / 10,
    ) / 10;
  return { ...x, scores: s, overall };
});

/** Price each supplier must quote to match the best real cost (rounded down to the paise). */
const best = rows.find((x) => x.r.rank === 1)!;
function priceToMatch(x: (typeof rows)[number], qty: number) {
  const target = BigInt(best.r.effective_cost_paise) - BigInt(x.r.freight_paise) - BigInt(x.r.other_charges_paise);
  return Number((target * 1000n) / BigInt(qty * 1000));
}

const scenario10k = compareQuotes(sampleComparison(AS_OF, { qty_needed: 10000 }));
const unregistered = compareQuotes(sampleComparison(AS_OF, { buyer_gst_registered: false }));
const noGstinInput = sampleComparison(AS_OF);
noGstinInput.quotes = noGstinInput.quotes.map((q) => (q.id === "B" ? { ...q, supplier_gstin: null } : q));
const noGstin = compareQuotes(noGstinInput);

const out = {
  as_of: AS_OF,
  cost_of_funds_pct: COST_OF_FUNDS_PCT,
  weights: WEIGHTS,
  need: formatQty(base.qty_needed_milli),
  savings: formatINR(base.savings_vs_runner_up_paise),
  suppliers: scored.map((x) => ({
    id: x.r.quote_id,
    name: x.r.supplier_name,
    rank: x.r.rank,
    quoted_unit: formatINR(x.q.unit_price_paise),
    gst: x.q.gst_treatment,
    gstin: x.q.supplier_gstin,
    moq: x.q.moq,
    lead_days: x.q.lead_time_days,
    valid_until: x.q.valid_until,
    terms: TERMS[x.r.quote_id].label,
    terms_stated: TERMS[x.r.quote_id].stated,
    stated: STATED[x.r.quote_id],
    formal_doc: FORMAL_DOC[x.r.quote_id],
    buy_qty: formatQty(x.r.purchase_qty_milli),
    excess_qty: formatQty(x.r.excess_qty_milli),
    excess_value: formatINR(x.r.excess_value_paise),
    goods: formatINR(x.r.goods_ex_gst_paise),
    freight: formatINR(x.r.freight_paise),
    subtotal: formatINR(x.r.subtotal_ex_gst_paise),
    gst_amt: formatINR(x.r.gst_paise),
    cash: formatINR(x.r.cash_outlay_paise),
    credit: formatINR(x.r.gst_credit_paise),
    effective: formatINR(x.r.effective_cost_paise),
    per_unit: formatINR(x.r.effective_per_unit_paise),
    diff: formatINR(x.r.difference_from_best_paise),
    financing: formatINR(x.fin),
    advance_amount: formatINR(Number(divRound(BigInt(x.r.cash_outlay_paise) * BigInt(TERMS[x.r.quote_id].advancePct), 100n))),
    per_unit_with_financing: formatINR(Number(divRound(BigInt(x.total) * 1000n, BigInt(base.qty_needed_milli)))),
    delivery_date: x.r.delivery_date,
    days_spare: x.r.delivery_date
      ? Math.round((Date.parse(REQUIRED_BY) - Date.parse(x.r.delivery_date)) / 86400000)
      : null,
    total_with_financing: formatINR(x.total),
    // raw paise for the cost-breakdown bars
    bars: {
      goods: x.r.goods_ex_gst_paise,
      goods_need: Number(divRound(BigInt(x.r.goods_ex_gst_paise) * BigInt(base.qty_needed_milli), BigInt(x.r.purchase_qty_milli))),
      excess: x.r.excess_value_paise,
      freight: x.r.freight_paise,
      gst_lost: x.r.gst_credit_eligible ? 0 : x.r.gst_paise,
      financing: x.fin,
    },
    price_to_match: x.r.rank === 1 ? null : formatINR(priceToMatch(x, 5000)),
    price_to_match_free_freight:
      x.r.rank === 1 ? null : formatINR(Number((BigInt(best.r.effective_cost_paise) * 1000n) / BigInt(base.qty_needed_milli))),
    price_to_match_at_moq:
      x.r.rank === 1 || x.r.purchase_qty_milli === base.qty_needed_milli
        ? null
        : formatINR(priceToMatch(x, x.r.purchase_qty_milli / 1000)),
    warnings: x.r.warnings.map((w) => ({ severity: w.severity, message: w.message })),
    scores: x.scores,
    overall: x.overall,
  })),
  scenario_10k: scenario10k.results.map((r) => ({ name: r.supplier_name, rank: r.rank, per_unit: formatINR(r.effective_per_unit_paise), effective: formatINR(r.effective_cost_paise) })),
  required_by: REQUIRED_BY,
  no_gstin: noGstin.results.map((r) => ({ name: r.supplier_name, rank: r.rank, per_unit: formatINR(r.effective_per_unit_paise), effective: formatINR(r.effective_cost_paise) })),
  unregistered: unregistered.results.map((r) => ({ name: r.supplier_name, rank: r.rank, per_unit: formatINR(r.effective_per_unit_paise), effective: formatINR(r.effective_cost_paise) })),
};
console.log(JSON.stringify(out, null, 2));
