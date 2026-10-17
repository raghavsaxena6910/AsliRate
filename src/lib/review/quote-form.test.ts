import { describe, expect, it } from "vitest";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR } from "@/lib/engine/money";
import { demoQuoteForms, DEMO_SETUP } from "@/lib/demo/demo-data";
import { SAMPLE_QUOTES } from "@/lib/demo/sample-quotes";
import { buildRationale } from "@/lib/rationale/template";
import { describeQuotedRate, singularUnit } from "@/lib/format";
import { formToQuoteInput, setupQty, validateSetup } from "./quote-form";

const AS_OF = "2026-10-17";

function demoResult(edit?: (forms: ReturnType<typeof demoQuoteForms>) => void) {
  const forms = demoQuoteForms();
  edit?.(forms);
  const quotes = forms.map((f) => {
    const r = formToQuoteInput(f);
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    return { ...r.quote, field_confidence: {} };
  });
  return compareQuotes({
    item_description: DEMO_SETUP.item_description,
    unit: DEMO_SETUP.unit,
    qty_needed: setupQty(DEMO_SETUP),
    buyer_gst_registered: true,
    as_of: AS_OF,
    quotes,
  });
}

describe("demo review forms", () => {
  it("round-trip to exactly the sample engine inputs", () => {
    demoQuoteForms().forEach((f, i) => {
      const r = formToQuoteInput(f);
      expect(r.ok).toBe(true);
      if (r.ok) {
        const rest: Record<string, unknown> = { ...r.quote };
        delete rest.field_confidence;
        const sample = SAMPLE_QUOTES[i];
        for (const [k, v] of Object.entries(rest)) {
          expect([k, v]).toEqual([k, (sample as Record<string, unknown>)[k] ?? v]);
        }
      }
    });
  });

  it("produce the reference ranking through the form path", () => {
    const r = demoResult();
    expect(r.results.map((x) => [x.quote_id, formatINR(x.effective_cost_paise)])).toEqual([
      ["B", "₹82,627.12"],
      ["A", "₹96,000.00"],
      ["C", "₹1,81,000.00"],
    ]);
  });

  it("clearing B's GSTIN on the review screen flips the ranking to A, B, C", () => {
    const r = demoResult((forms) => {
      forms[1].supplier_gstin = "";
    });
    expect(r.results.map((x) => x.quote_id)).toEqual(["A", "B", "C"]);
    expect(formatINR(r.results[1].effective_cost_paise)).toBe("₹97,500.00");
  });

  it("accepts messy typed amounts", () => {
    const f = demoQuoteForms()[0];
    f.unit_price = "₹ 18/-";
    f.freight = "6,000";
    const r = formToQuoteInput(f);
    expect(r.ok && r.quote.unit_price_paise).toBe(1800);
    expect(r.ok && r.quote.freight_paise).toBe(600000);
  });

  it("returns field errors instead of guessing", () => {
    const f = demoQuoteForms()[0];
    f.unit_price = "eighteen";
    f.supplier_gstin = "06ABC";
    f.lead_time_days = "1.5";
    const r = formToQuoteInput(f);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["lead_time_days", "supplier_gstin", "unit_price"]);
  });

  it("validates setup", () => {
    expect(validateSetup(DEMO_SETUP)).toEqual({});
    expect(Object.keys(validateSetup({ ...DEMO_SETUP, qty_needed: "0", unit: " " })).sort()).toEqual([
      "qty_needed",
      "unit",
    ]);
  });
});

describe("rationale (template, engine numbers only)", () => {
  it("explains the reference ranking", () => {
    const paras = buildRationale(demoResult());
    expect(paras[0]).toBe(
      "Om Corrugators is the lowest real cost: ₹82,627.12 for 5,000 boxes, or ₹16.53 a box. That's despite Kanha Paper Products quoting the lowest rate on paper.",
    );
    expect(paras.join(" ")).toContain("Shree Balaji Packaging costs ₹13,372.88 more");
    expect(paras.join(" ")).toContain("5,000 extra worth ₹90,500.00");
  });

  it("only contains rupee amounts that appear in the engine output", () => {
    const result = demoResult();
    const engineAmounts = new Set<string>();
    const collect = (v: unknown, key = "") => {
      if (typeof v === "number" && key.endsWith("_paise")) engineAmounts.add(formatINR(v));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) collect(x, k);
    };
    collect(result);
    const mentioned = buildRationale(result).join(" ").match(/₹[\d,]+\.\d{2}/g) ?? [];
    expect(mentioned.length).toBeGreaterThan(5);
    for (const amount of mentioned) expect(engineAmounts).toContain(amount);
  });
});

describe("wording helpers", () => {
  it.each([
    ["boxes", "box"],
    ["rolls", "roll"],
    ["bottles", "bottle"],
    ["pouches", "pouch"],
    ["kg", "kg"],
    ["batteries", "battery"],
  ])("%s → %s", (plural, single) => expect(singularUnit(plural)).toBe(single));

  it("describes quotes the way suppliers write them", () => {
    expect(describeQuotedRate(SAMPLE_QUOTES[0], "boxes")).toBe("₹18.00 per box + GST, freight ₹6,000.00 extra");
    expect(describeQuotedRate(SAMPLE_QUOTES[1], "boxes")).toBe("₹19.50 per box GST incl., delivered");
    expect(describeQuotedRate({ ...SAMPLE_QUOTES[0], unit_price_paise: 180000, price_basis: 100 }, "boxes")).toBe(
      "₹1,800.00 per 100 boxes + GST, freight ₹6,000.00 extra",
    );
  });
});
