import { z } from "zod";
import { hasAtMost3Decimals } from "./money";

/**
 * Input contract for the engine. The AI extraction step and the review screen
 * both produce data in this shape; the engine refuses anything else.
 */

export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const quantity = z
  .number()
  .positive()
  .refine(hasAtMost3Decimals, "Use at most 3 decimal places");

const paise = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const QUOTE_FIELDS = [
  "supplier_name",
  "unit_price_paise",
  "price_basis",
  "gst_treatment",
  "gst_rate_percent",
  "supplier_gstin",
  "freight_treatment",
  "freight_paise",
  "other_charges",
  "moq",
  "pack_size",
  "lead_time_days",
  "valid_until",
  "item_description",
] as const;
export type QuoteField = (typeof QUOTE_FIELDS)[number];

export const QUOTE_FIELD_LABELS: Record<QuoteField, string> = {
  supplier_name: "supplier name",
  unit_price_paise: "unit price",
  price_basis: "price basis",
  gst_treatment: "GST included/extra",
  gst_rate_percent: "GST rate",
  supplier_gstin: "GSTIN",
  freight_treatment: "freight terms",
  freight_paise: "freight amount",
  other_charges: "other charges",
  moq: "minimum order quantity",
  pack_size: "pack size",
  lead_time_days: "lead time",
  valid_until: "validity date",
  item_description: "item description",
};

export const otherChargeSchema = z.object({
  label: z.string().trim().min(1).max(80),
  amount_paise: paise,
});

export const quoteInputSchema = z.object({
  id: z.string().min(1),
  supplier_name: z.string().trim().min(1).max(120),
  item_description: z.string().trim().max(300).nullable().default(null),
  /** Price in paise for `price_basis` units (e.g. ₹1,800 per 100 boxes → 180000 & 100). */
  unit_price_paise: paise,
  price_basis: quantity.default(1),
  gst_treatment: z.enum(["included", "extra"]),
  /** Total GST rate in percent, e.g. 18. Null means the quote didn't say. */
  gst_rate_percent: z.number().min(0).max(40).nullable().default(null),
  supplier_gstin: z.string().trim().toUpperCase().nullable().default(null),
  /** User confirms the supplier will issue a proper tax invoice (allows credit without a GSTIN on the quote). */
  tax_invoice_confirmed: z.boolean().default(false),
  freight_treatment: z.enum(["included", "extra", "not_mentioned"]),
  /** Freight amount ex-GST for the whole order, in paise. */
  freight_paise: paise.nullable().default(null),
  other_charges: z.array(otherChargeSchema).max(10).default([]),
  moq: quantity.nullable().default(null),
  pack_size: quantity.nullable().default(null),
  lead_time_days: z.number().int().nonnegative().max(365).nullable().default(null),
  valid_until: z.iso.date().nullable().default(null),
  /** False when the item differs from what the buyer asked for (size, grade, ply…). */
  like_for_like: z.boolean().default(true),
  like_for_like_note: z.string().trim().max(300).nullable().default(null),
  /** 0–1 confidence per field from extraction; fields the user confirmed should be set to 1. */
  field_confidence: z.partialRecord(z.enum(QUOTE_FIELDS), z.number().min(0).max(1)).default({}),
});

export const comparisonInputSchema = z.object({
  item_description: z.string().trim().min(1).max(300),
  unit: z.string().trim().min(1).max(30),
  qty_needed: quantity,
  buyer_gst_registered: z.boolean(),
  /** The date the comparison is made (YYYY-MM-DD). Drives expiry and deadline checks. */
  as_of: z.iso.date(),
  required_by: z.iso.date().nullable().default(null),
  quotes: z
    .array(quoteInputSchema)
    .min(1)
    .max(6)
    .refine((qs) => new Set(qs.map((q) => q.id)).size === qs.length, "Quote ids must be unique"),
});

export type QuoteInput = z.input<typeof quoteInputSchema>;
export type ComparisonInput = z.input<typeof comparisonInputSchema>;
export type ParsedQuote = z.output<typeof quoteInputSchema>;
export type ParsedComparison = z.output<typeof comparisonInputSchema>;
