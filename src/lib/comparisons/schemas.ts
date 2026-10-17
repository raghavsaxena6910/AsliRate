import { z } from "zod";
import { QUOTE_FIELDS } from "@/lib/engine/schema";
import { hasAtMost3Decimals } from "@/lib/engine/money";

export const ENGINE_VERSION = "1.0";
export const MAX_QUOTES = 6;
export const MIN_QUOTES = 2;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type ComparisonStatus = "draft" | "reading" | "review" | "complete";

export const newComparisonSchema = z.object({
  item_description: z.string().trim().min(1, "Describe what you're buying.").max(300),
  specification: z.string().trim().max(500),
  qty_needed: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/,/g, "")))
    .pipe(
      z
        .number({ error: "Enter a quantity." })
        .positive("Enter a quantity above 0.")
        .refine(hasAtMost3Decimals, "Use at most 3 decimal places."),
    ),
  unit: z.string().trim().min(1, "Enter a unit, like boxes or kg.").max(30),
  required_by: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a date.")
    .transform((v) => v || null),
  deliver_to: z.string().trim().max(200),
  buyer_gst_registered: z.boolean(),
});

const short = (n: number) => z.string().max(n);

/** Shape of a review form sent from the browser; validated before anything is saved. */
export const quoteFormSchema = z.object({
  id: z.uuid(),
  supplier_name: short(120),
  item_description: short(300),
  unit_price: short(30),
  price_basis: short(20),
  gst_treatment: z.enum(["included", "extra"]),
  gst_rate: short(10),
  supplier_gstin: short(20),
  tax_invoice_confirmed: z.boolean(),
  freight_treatment: z.enum(["included", "extra", "not_mentioned"]),
  freight: short(30),
  other_charges: short(30),
  moq: short(20),
  pack_size: short(20),
  lead_time_days: short(10),
  valid_until: short(10),
  like_for_like: z.boolean(),
  like_for_like_note: short(300),
  confidence: z.partialRecord(z.enum(QUOTE_FIELDS), z.number().min(0).max(1)),
  source: z.partialRecord(z.enum(QUOTE_FIELDS), short(200)),
});

export const reviewSubmissionSchema = z.array(quoteFormSchema).min(1).max(MAX_QUOTES);

/** What we store in quotes.extracted after reading a file. */
export interface ExtractedRecord {
  method: string;
  note: string;
  found: string[];
  form: z.infer<typeof quoteFormSchema>;
}

export function nextPathFor(id: string, status: ComparisonStatus): string {
  if (status === "complete") return `/comparisons/${id}`;
  if (status === "review") return `/comparisons/${id}/review`;
  return `/comparisons/${id}/quotes`;
}
