import { describe, expect, it } from "vitest";
import { compareQuotes, type ComparisonResult, type QuoteResult } from "./compare";
import { formatINR, formatQty } from "./money";
import type { ComparisonInput, QuoteInput } from "./schema";
import { SAMPLE_QUOTE_A, SAMPLE_QUOTE_B, sampleComparison } from "@/lib/demo/sample-quotes";

const AS_OF = "2026-10-17";

function byId(result: ComparisonResult, id: string): QuoteResult {
  const r = result.results.find((x) => x.quote_id === id);
  if (!r) throw new Error(`No result for ${id}`);
  return r;
}
const codes = (r: QuoteResult) => r.warnings.map((w) => w.code);
const ranking = (result: ComparisonResult) => result.results.map((r) => r.quote_id);

/** One-quote comparison helper for focused rule tests. */
function single(quote: Partial<QuoteInput>, comparison: Partial<ComparisonInput> = {}) {
  const res = compareQuotes({
    item_description: "Test item",
    unit: "units",
    qty_needed: 5000,
    buyer_gst_registered: true,
    as_of: AS_OF,
    quotes: [{ ...SAMPLE_QUOTE_A, ...quote, id: "X" }],
    ...comparison,
  });
  return res.results[0];
}

describe("reference case from the brief (5,000 boxes, GST-registered buyer, 18%)", () => {
  const result = compareQuotes(sampleComparison(AS_OF));

  it("B: ₹19.50 all-inclusive with GSTIN → ₹82,627.12, ₹16.53/box, rank 1", () => {
    const b = byId(result, "B");
    expect(formatINR(b.effective_cost_paise)).toBe("₹82,627.12");
    expect(formatINR(b.effective_per_unit_paise)).toBe("₹16.53");
    expect(b.rank).toBe(1);
    expect(b.gst_credit_eligible).toBe(true);
    expect(b.freight_paise).toBe(0);
    expect(b.warnings).toEqual([]);
  });

  it("A: ₹18.00 + GST + ₹6,000 freight → ₹96,000.00, ₹19.20/box, rank 2", () => {
    const a = byId(result, "A");
    expect(formatINR(a.effective_cost_paise)).toBe("₹96,000.00");
    expect(formatINR(a.effective_per_unit_paise)).toBe("₹19.20");
    expect(a.rank).toBe(2);
    expect(formatINR(a.gst_paise)).toBe("₹17,280.00");
    expect(formatINR(a.cash_outlay_paise)).toBe("₹1,13,280.00");
    expect(a.warnings).toEqual([]);
  });

  it("C: ₹17.20 + GST + ₹9,000 freight, MOQ 10,000 → ₹1,81,000.00, ₹36.20/box, rank 3, excess ₹90,500", () => {
    const c = byId(result, "C");
    expect(formatINR(c.effective_cost_paise)).toBe("₹1,81,000.00");
    expect(formatINR(c.effective_per_unit_paise)).toBe("₹36.20");
    expect(c.rank).toBe(3);
    expect(formatQty(c.purchase_qty_milli)).toBe("10,000");
    expect(formatQty(c.excess_qty_milli)).toBe("5,000");
    expect(formatINR(c.excess_value_paise)).toBe("₹90,500.00");
    expect(codes(c)).toEqual(["MOQ_ABOVE_NEED"]);
    expect(c.warnings[0].message).toBe(
      "Minimum order is 10,000 boxes but you need 5,000. You'd buy 5,000 extra worth ₹90,500.00.",
    );
  });

  it("ranks B, A, C and recommends B, saving ₹13,372.88 over A", () => {
    expect(ranking(result)).toEqual(["B", "A", "C"]);
    expect(result.recommended_quote_id).toBe("B");
    expect(formatINR(result.savings_vs_runner_up_paise)).toBe("₹13,372.88");
  });
});

describe("reference case: B without a GSTIN", () => {
  const input = sampleComparison(AS_OF);
  input.quotes = input.quotes.map((q) => (q.id === "B" ? { ...q, supplier_gstin: null } : q));
  const result = compareQuotes(input);
  const b = byId(result, "B");

  it("B's effective cost becomes the full cash outlay ₹97,500.00", () => {
    expect(formatINR(b.effective_cost_paise)).toBe("₹97,500.00");
    expect(formatINR(b.subtotal_ex_gst_paise)).toBe("₹82,627.12");
    expect(formatINR(b.gst_paise)).toBe("₹14,872.88");
    expect(b.gst_credit_eligible).toBe(false);
    expect(b.gst_credit_paise).toBe(0);
  });

  it("ranking becomes A, B, C", () => {
    expect(ranking(result)).toEqual(["A", "B", "C"]);
  });

  it("warns that GST is included but there's no GSTIN", () => {
    expect(codes(b)).toContain("GST_INCLUDED_NO_GSTIN");
    expect(b.warnings.find((w) => w.code === "GST_INCLUDED_NO_GSTIN")!.message).toContain("₹14,872.88");
  });

  it("restores credit if the user confirms a tax invoice will be issued", () => {
    const confirmed = sampleComparison(AS_OF);
    confirmed.quotes = confirmed.quotes.map((q) =>
      q.id === "B" ? { ...q, supplier_gstin: null, tax_invoice_confirmed: true } : q,
    );
    const r = compareQuotes(confirmed);
    expect(formatINR(byId(r, "B").effective_cost_paise)).toBe("₹82,627.12");
    expect(codes(byId(r, "B"))).not.toContain("GST_INCLUDED_NO_GSTIN");
  });
});

describe("unregistered buyer", () => {
  it("uses cash outlay for everyone, so B (₹97,500) beats A (₹1,13,280)", () => {
    const result = compareQuotes(sampleComparison(AS_OF, { buyer_gst_registered: false }));
    expect(ranking(result)).toEqual(["B", "A", "C"]);
    expect(formatINR(byId(result, "A").effective_cost_paise)).toBe("₹1,13,280.00");
    expect(formatINR(byId(result, "B").effective_cost_paise)).toBe("₹97,500.00");
    expect(formatINR(byId(result, "C").effective_cost_paise)).toBe("₹2,13,580.00");
  });
});

describe("price basis, MOQ and pack size", () => {
  it("₹1,800 per 100 boxes equals ₹18.00 per box", () => {
    const r = single({ unit_price_paise: 180000, price_basis: 100 });
    expect(formatINR(r.effective_cost_paise)).toBe("₹96,000.00");
    expect(formatINR(r.unit_price_ex_gst_paise)).toBe("₹18.00");
  });

  it("rounds purchase quantity up to whole packs", () => {
    const r = single({ moq: null, pack_size: 300, freight_paise: 0 });
    expect(formatQty(r.purchase_qty_milli)).toBe("5,100");
    expect(formatINR(r.goods_ex_gst_paise)).toBe("₹91,800.00");
    expect(formatINR(r.excess_value_paise)).toBe("₹1,800.00");
    expect(codes(r)).toEqual(["PACK_SIZE_ROUNDUP"]);
  });

  it("applies MOQ first, then pack size", () => {
    const r = single({ moq: 6000, pack_size: 250, freight_paise: 0 });
    expect(formatQty(r.purchase_qty_milli)).toBe("6,000");
    const r2 = single({ moq: 6100, pack_size: 250, freight_paise: 0 });
    expect(formatQty(r2.purchase_qty_milli)).toBe("6,250");
    expect(codes(r2)).toEqual(["MOQ_ABOVE_NEED", "PACK_SIZE_ROUNDUP"]);
  });

  it("handles decimal quantities (12.5 kg at ₹240/kg)", () => {
    const r = single({ unit_price_paise: 24000, freight_paise: 0, moq: null }, { qty_needed: 12.5 });
    expect(formatINR(r.effective_cost_paise)).toBe("₹3,000.00");
    expect(formatINR(r.effective_per_unit_paise)).toBe("₹240.00");
  });

  it("does not warn when MOQ is at or below need", () => {
    expect(codes(single({ moq: 5000 }))).toEqual([]);
  });
});

describe("GST handling", () => {
  it("assumes 18% when the rate is missing, and warns", () => {
    const r = single({ ...SAMPLE_QUOTE_B, gst_rate_percent: null });
    expect(r.gst_rate_percent).toBe(18);
    expect(r.gst_rate_assumed).toBe(true);
    expect(formatINR(r.effective_cost_paise)).toBe("₹82,627.12");
    expect(codes(r)).toEqual(["GST_RATE_ASSUMED"]);
  });

  it("backs GST out of an inclusive price at 5%", () => {
    const r = single({ ...SAMPLE_QUOTE_B, gst_rate_percent: 5 });
    // 1950 × 5000 / 1.05 = 92,85,714.29 paise → ₹92,857.14
    expect(formatINR(r.effective_cost_paise)).toBe("₹92,857.14");
  });

  it("charges GST on freight and other charges too", () => {
    const r = single({ other_charges: [{ label: "Printing plate", amount_paise: 250000 }] });
    expect(formatINR(r.subtotal_ex_gst_paise)).toBe("₹98,500.00");
    expect(formatINR(r.gst_paise)).toBe("₹17,730.00");
    expect(formatINR(r.cash_outlay_paise)).toBe("₹1,16,230.00");
  });

  it("treats 0% GST goods correctly", () => {
    const r = single({ gst_rate_percent: 0 }, { buyer_gst_registered: false });
    expect(r.gst_paise).toBe(0);
    expect(formatINR(r.effective_cost_paise)).toBe("₹96,000.00");
  });

  it("rejects a malformed GSTIN for credit and warns", () => {
    const r = single({ supplier_gstin: "06ABC123" });
    expect(r.gst_credit_eligible).toBe(false);
    expect(formatINR(r.effective_cost_paise)).toBe("₹1,13,280.00");
    expect(codes(r)).toEqual(["GSTIN_INVALID"]);
  });

  it("accepts a lowercase GSTIN by normalising it", () => {
    expect(single({ supplier_gstin: "06aapfs4721k1zu" }).gst_credit_eligible).toBe(true);
  });
});

describe("freight", () => {
  it("warns when freight is extra but has no amount", () => {
    const r = single({ freight_paise: null });
    expect(formatINR(r.effective_cost_paise)).toBe("₹90,000.00");
    expect(codes(r)).toEqual(["FREIGHT_MISSING"]);
  });

  it("warns when freight isn't mentioned at all", () => {
    expect(codes(single({ freight_treatment: "not_mentioned", freight_paise: null }))).toEqual(["FREIGHT_MISSING"]);
  });

  it("ignores a freight amount when freight is included", () => {
    expect(single({ freight_treatment: "included", freight_paise: 600000 }).freight_paise).toBe(0);
  });
});

describe("dates", () => {
  it("flags an expired quote", () => {
    const r = single({ valid_until: "2026-10-10" });
    expect(codes(r)).toEqual(["QUOTE_EXPIRED"]);
    expect(r.warnings[0].message).toContain("10 Oct 2026");
  });

  it("a quote valid until today is not expired", () => {
    expect(codes(single({ valid_until: AS_OF }))).toEqual([]);
  });

  it("flags lead time that misses the required-by date", () => {
    const r = single({ lead_time_days: 21 }, { required_by: "2026-10-31" });
    expect(r.delivery_date).toBe("2026-11-07");
    expect(codes(r)).toEqual(["LEAD_TIME_MISSES_DEADLINE"]);
  });

  it("accepts delivery exactly on the required-by date", () => {
    expect(codes(single({ lead_time_days: 14 }, { required_by: "2026-10-31" }))).toEqual([]);
  });
});

describe("quality flags", () => {
  it("flags items that aren't like-for-like, with the note", () => {
    const r = single({ like_for_like: false, like_for_like_note: "Quoted 5-ply, you asked for 3-ply" });
    expect(codes(r)).toEqual(["NOT_LIKE_FOR_LIKE"]);
    expect(r.warnings[0].message).toBe("Not the same item: Quoted 5-ply, you asked for 3-ply");
  });

  it("flags low-confidence fields below 0.7 only", () => {
    const r = single({ field_confidence: { unit_price_paise: 0.55, moq: 0.9, freight_paise: 0.69 } });
    expect(codes(r)).toEqual(["LOW_CONFIDENCE"]);
    expect(r.warnings[0].fields).toEqual(["unit_price_paise", "freight_paise"]);
    expect(r.warnings[0].message).toContain("unit price, freight amount");
  });
});

describe("ranking ties", () => {
  it("breaks an exact cost tie by shorter lead time", () => {
    const result = compareQuotes({
      ...sampleComparison(AS_OF),
      quotes: [
        { ...SAMPLE_QUOTE_A, id: "slow", supplier_name: "Slow", lead_time_days: 12 },
        { ...SAMPLE_QUOTE_A, id: "fast", supplier_name: "Fast", lead_time_days: 5 },
        { ...SAMPLE_QUOTE_A, id: "unknown", supplier_name: "Unknown", lead_time_days: null },
      ],
    });
    expect(ranking(result)).toEqual(["fast", "slow", "unknown"]);
    expect(result.savings_vs_runner_up_paise).toBe(0);
  });
});

describe("input validation", () => {
  it("rejects a negative price", () => {
    expect(() => single({ unit_price_paise: -100 })).toThrow();
  });
  it("rejects a fractional paise price", () => {
    expect(() => single({ unit_price_paise: 1800.5 })).toThrow();
  });
  it("rejects more than 6 quotes", () => {
    const quotes = Array.from({ length: 7 }, (_, i) => ({ ...SAMPLE_QUOTE_A, id: `q${i}` }));
    expect(() => compareQuotes({ ...sampleComparison(AS_OF), quotes })).toThrow();
  });
  it("rejects duplicate quote ids", () => {
    expect(() => compareQuotes({ ...sampleComparison(AS_OF), quotes: [SAMPLE_QUOTE_A, SAMPLE_QUOTE_A] })).toThrow();
  });
  it("rejects zero quantity and quantities with more than 3 decimals", () => {
    expect(() => single({}, { qty_needed: 0 })).toThrow();
    expect(() => single({}, { qty_needed: 1.2345 })).toThrow();
  });
  it("rejects a GST rate above 40%", () => {
    expect(() => single({ gst_rate_percent: 50 })).toThrow();
  });
});

describe("determinism", () => {
  it("gives identical output for identical input", () => {
    expect(compareQuotes(sampleComparison(AS_OF))).toEqual(compareQuotes(sampleComparison(AS_OF)));
  });
  it("does not depend on input order", () => {
    const reversed = sampleComparison(AS_OF);
    reversed.quotes = [...reversed.quotes].reverse();
    expect(ranking(compareQuotes(reversed))).toEqual(["B", "A", "C"]);
  });
  it("does not mutate the caller's input", () => {
    const input = sampleComparison(AS_OF);
    const snapshot = JSON.stringify(input);
    compareQuotes(input);
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(SAMPLE_QUOTE_B.supplier_gstin).toBe("07BHKPR2219M1ZX");
  });
});

describe("difference from best", () => {
  it("is computed by the engine for every rank", () => {
    const result = compareQuotes(sampleComparison(AS_OF));
    expect(result.results.map((r) => formatINR(r.difference_from_best_paise))).toEqual([
      "₹0.00",
      "₹13,372.88",
      "₹98,372.88",
    ]);
  });
});
