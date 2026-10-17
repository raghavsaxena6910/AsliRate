import type { ComparisonInput, QuoteInput } from "@/lib/engine/schema";

/**
 * The three sample suppliers used by demo mode and by the engine's reference
 * test. All names and GSTINs are fictional (format- and checksum-valid).
 *
 * Scenario: a D2C brand needs 5,000 shipping boxes, is GST-registered, and the
 * boxes attract 18% GST.
 */

export const SAMPLE_ITEM = "3-ply corrugated shipping box, 12 × 10 × 8 in, brown kraft";
export const SAMPLE_UNIT = "boxes";
export const SAMPLE_QTY_NEEDED = 5000;

/** A — formal PDF quotation: ₹18.00/box, GST extra, freight ₹6,000 extra. */
export const SAMPLE_QUOTE_A: QuoteInput = {
  id: "A",
  supplier_name: "Shree Balaji Packaging",
  item_description: "3-ply corrugated box 12x10x8 inch, brown kraft, 150 GSM",
  unit_price_paise: 1800,
  price_basis: 1,
  gst_treatment: "extra",
  gst_rate_percent: 18,
  supplier_gstin: "06AAPFS4721K1ZU",
  freight_treatment: "extra",
  freight_paise: 600000,
  other_charges: [],
  moq: 2000,
  pack_size: null,
  lead_time_days: 10,
  valid_until: "2027-03-31",
  like_for_like: true,
};

/** B — WhatsApp message: ₹19.50/box all-inclusive (GST + delivery), GSTIN given. */
export const SAMPLE_QUOTE_B: QuoteInput = {
  id: "B",
  supplier_name: "Om Corrugators",
  item_description: "3 ply box 12x10x8 brown",
  unit_price_paise: 1950,
  price_basis: 1,
  gst_treatment: "included",
  gst_rate_percent: 18,
  supplier_gstin: "07BHKPR2219M1ZX",
  freight_treatment: "included",
  freight_paise: null,
  other_charges: [],
  moq: null,
  pack_size: null,
  lead_time_days: 7,
  valid_until: null,
  like_for_like: true,
};

/** C — Excel rate sheet: ₹17.20/box, GST extra, freight ₹9,000, MOQ 10,000. */
export const SAMPLE_QUOTE_C: QuoteInput = {
  id: "C",
  supplier_name: "Kanha Paper Products",
  item_description: "Corrugated box 3-ply 12x10x8 in, natural kraft",
  unit_price_paise: 1720,
  price_basis: 1,
  gst_treatment: "extra",
  gst_rate_percent: 18,
  supplier_gstin: "09AAJCK8834D1Z9",
  freight_treatment: "extra",
  freight_paise: 900000,
  other_charges: [],
  moq: 10000,
  pack_size: null,
  lead_time_days: 14,
  valid_until: "2027-03-31",
  like_for_like: true,
};

export const SAMPLE_QUOTES: QuoteInput[] = [SAMPLE_QUOTE_A, SAMPLE_QUOTE_B, SAMPLE_QUOTE_C];

export function sampleComparison(asOf: string, overrides: Partial<ComparisonInput> = {}): ComparisonInput {
  return {
    item_description: SAMPLE_ITEM,
    unit: SAMPLE_UNIT,
    qty_needed: SAMPLE_QTY_NEEDED,
    buyer_gst_registered: true,
    as_of: asOf,
    required_by: null,
    quotes: SAMPLE_QUOTES.map((q) => ({ ...q })),
    ...overrides,
  };
}
