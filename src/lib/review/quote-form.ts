import { rupeesToPaise, hasAtMost3Decimals } from "@/lib/engine/money";
import { GSTIN_PATTERN, type QuoteField, type QuoteInput } from "@/lib/engine/schema";

/**
 * What the review screen edits. Everything a person types is a string until
 * it is converted here, so "₹6,000/-" and "6000" both work and nothing is
 * silently coerced into a wrong number.
 */
export interface QuoteForm {
  id: string;
  supplier_name: string;
  item_description: string;
  unit_price: string;
  price_basis: string;
  gst_treatment: "included" | "extra";
  gst_rate: string;
  supplier_gstin: string;
  tax_invoice_confirmed: boolean;
  freight_treatment: "included" | "extra" | "not_mentioned";
  freight: string;
  other_charges: string;
  moq: string;
  pack_size: string;
  lead_time_days: string;
  valid_until: string;
  like_for_like: boolean;
  like_for_like_note: string;
  /** 0–1 per field from extraction; set to 1 once the user confirms a field. */
  confidence: Partial<Record<QuoteField, number>>;
  /** Where in the document each value was read from. */
  source: Partial<Record<QuoteField, string>>;
}

export type FormErrors = Partial<Record<keyof QuoteForm, string>>;

export interface SetupForm {
  item_description: string;
  unit: string;
  qty_needed: string;
  required_by: string;
  buyer_gst_registered: boolean;
}

const blank = (s: string) => s.trim() === "";

function parseQty(raw: string): number | null {
  const n = Number(raw.replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0 || !hasAtMost3Decimals(n)) return null;
  return n;
}

export function validateSetup(s: SetupForm): Partial<Record<keyof SetupForm, string>> {
  const errors: Partial<Record<keyof SetupForm, string>> = {};
  if (blank(s.item_description)) errors.item_description = "Describe what you're buying.";
  if (blank(s.unit)) errors.unit = "Enter a unit, like boxes or kg.";
  if (parseQty(s.qty_needed) == null) errors.qty_needed = "Enter a quantity above 0 (up to 3 decimals).";
  return errors;
}

export function setupQty(s: SetupForm): number {
  const q = parseQty(s.qty_needed);
  if (q == null) throw new Error("Invalid quantity");
  return q;
}

/** Convert a reviewed form into engine input, or return field errors. */
export function formToQuoteInput(f: QuoteForm): { ok: true; quote: QuoteInput } | { ok: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const money = (key: keyof QuoteForm, raw: string, required: boolean): number | null => {
    if (blank(raw)) {
      if (required) errors[key] = "Required.";
      return null;
    }
    try {
      const p = rupeesToPaise(raw);
      if (p < 0) throw new Error();
      return p;
    } catch {
      errors[key] = "Enter an amount like 18.50 or 6,000.";
      return null;
    }
  };
  const qty = (key: keyof QuoteForm, raw: string): number | null => {
    if (blank(raw)) return null;
    const n = parseQty(raw);
    if (n == null) errors[key] = "Enter a number above 0.";
    return n;
  };

  if (blank(f.supplier_name)) errors.supplier_name = "Required.";
  const unitPrice = money("unit_price", f.unit_price, true);
  const basis = blank(f.price_basis) ? 1 : qty("price_basis", f.price_basis);

  let gstRate: number | null = null;
  if (!blank(f.gst_rate)) {
    const n = Number(f.gst_rate.replace("%", "").trim());
    if (!Number.isFinite(n) || n < 0 || n > 40) errors.gst_rate = "Enter a rate between 0 and 40.";
    else gstRate = n;
  }

  const gstin = f.supplier_gstin.trim().toUpperCase();
  if (gstin && !GSTIN_PATTERN.test(gstin)) {
    errors.supplier_gstin = "A GSTIN has 15 characters, like 06ABCDE1234F1Z5.";
  }

  const freight =
    f.freight_treatment === "extra" ? money("freight", f.freight, false) : null;
  const other = money("other_charges", f.other_charges, false);
  const moq = qty("moq", f.moq);
  const pack = qty("pack_size", f.pack_size);

  let lead: number | null = null;
  if (!blank(f.lead_time_days)) {
    const n = Number(f.lead_time_days.trim());
    if (!Number.isInteger(n) || n < 0 || n > 365) errors.lead_time_days = "Enter whole days, 0–365.";
    else lead = n;
  }
  const validUntil = blank(f.valid_until) ? null : f.valid_until;
  if (validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) errors.valid_until = "Enter a date.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    quote: {
      id: f.id,
      supplier_name: f.supplier_name.trim(),
      item_description: f.item_description.trim() || null,
      unit_price_paise: unitPrice!,
      price_basis: basis ?? 1,
      gst_treatment: f.gst_treatment,
      gst_rate_percent: gstRate,
      // A malformed GSTIN is rejected above; blank means none.
      supplier_gstin: gstin || null,
      tax_invoice_confirmed: f.tax_invoice_confirmed,
      freight_treatment: f.freight_treatment,
      freight_paise: freight,
      other_charges: other ? [{ label: "Other charges", amount_paise: other }] : [],
      moq,
      pack_size: pack,
      lead_time_days: lead,
      valid_until: validUntil,
      like_for_like: f.like_for_like,
      like_for_like_note: f.like_for_like ? null : f.like_for_like_note.trim() || null,
      field_confidence: f.confidence,
    },
  };
}
