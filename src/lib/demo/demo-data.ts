import { formatQty, toMilli } from "@/lib/engine/money";
import type { QuoteInput } from "@/lib/engine/schema";
import type { QuoteForm, SetupForm } from "@/lib/review/quote-form";
import {
  SAMPLE_ITEM,
  SAMPLE_QTY_NEEDED,
  SAMPLE_QUOTE_A,
  SAMPLE_QUOTE_B,
  SAMPLE_QUOTE_C,
  SAMPLE_UNIT,
} from "./sample-quotes";

/**
 * Demo mode pretends the three sample files have already been read by the AI.
 * The values match the files in /public/samples exactly; the source snippets
 * are the text each value was read from; one field is deliberately
 * low-confidence so the review screen has something to confirm.
 */

export interface DemoFile {
  quoteId: string;
  name: string;
  kind: "PDF" | "Image" | "Excel";
  href: string;
  size: string;
  description: string;
}

export const DEMO_FILES: DemoFile[] = [
  {
    quoteId: "A",
    name: "Shree-Balaji-Quotation-SBP-2611.pdf",
    kind: "PDF",
    href: "/samples/quote-A-shree-balaji.pdf",
    size: "PDF quotation",
    description: "Formal quotation on letterhead",
  },
  {
    quoteId: "B",
    name: "WhatsApp Image 2026-10-15.png",
    kind: "Image",
    href: "/samples/quote-B-om-corrugators-whatsapp.png",
    size: "WhatsApp screenshot",
    description: "Rate sent on WhatsApp",
  },
  {
    quoteId: "C",
    name: "Kanha_Rate_List_Oct26.xlsx",
    kind: "Excel",
    href: "/samples/quote-C-kanha-rate-list.xlsx",
    size: "Excel rate sheet",
    description: "Rate list with terms",
  },
];

export const DEMO_SETUP: SetupForm = {
  item_description: SAMPLE_ITEM,
  unit: SAMPLE_UNIT,
  qty_needed: String(SAMPLE_QTY_NEEDED),
  required_by: "",
  buyer_gst_registered: true,
};

const SOURCES: Record<string, QuoteForm["source"]> = {
  A: {
    supplier_name: "Letterhead: SHREE BALAJI PACKAGING, Sector 24, Faridabad",
    unit_price_paise: "Rate: ₹18.00 per box",
    gst_treatment: "Terms 1: GST @ 18% extra as applicable",
    gst_rate_percent: "Terms 1: GST @ 18% extra as applicable",
    supplier_gstin: "GSTIN: 06AAPFS4721K1ZU",
    freight_treatment: "Terms 2: Freight ₹6,000 extra (Gurugram delivery)",
    freight_paise: "Terms 2: Freight ₹6,000 extra (Gurugram delivery)",
    moq: "Terms 3: Minimum order 2,000 boxes",
    lead_time_days: "Terms 4: Delivery within 10 days of PO",
    valid_until: "Terms 5: Valid till 31-03-2027",
  },
  B: {
    supplier_name: "Chat header: Om Corrugators",
    unit_price_paise: "“12x10x8 3 ply brown — 19.50 per box all inclusive”",
    gst_treatment: "“all inclusive (GST 18% + delivery)”",
    gst_rate_percent: "“GST 18%”",
    supplier_gstin: "“GST no. 07BHKPR2219M1ZX”",
    freight_treatment: "“+ delivery”",
    lead_time_days: "“ready in 1 week”",
  },
  C: {
    supplier_name: "Sheet title: Kanha Paper Products — Rate List",
    unit_price_paise: "Row 6: 3 Ply 12x10x8 | ₹17.20",
    gst_treatment: "Terms: GST 18% extra",
    gst_rate_percent: "Terms: GST 18% extra",
    supplier_gstin: "Cell B3: GSTIN 09AAJCK8834D1Z9",
    freight_treatment: "Terms: Freight to Gurugram ₹9,000",
    freight_paise: "Terms: Freight to Gurugram ₹9,000",
    moq: "Row 6: MOQ 10,000",
    lead_time_days: "Terms: Dispatch in 2 weeks",
    valid_until: "Terms: Rates valid up to 31 Mar 2027",
  },
};

const CONFIDENCE: Record<string, QuoteForm["confidence"]> = {
  A: {},
  B: {},
  // "Dispatch in 2 weeks" is dispatch, not delivery — a reviewer should confirm.
  C: { lead_time_days: 0.62 },
};

function money(paise: number | null | undefined): string {
  if (paise == null) return "";
  const r = Math.floor(paise / 100);
  const p = paise % 100;
  return p === 0 ? String(r) : `${r}.${String(p).padStart(2, "0")}`;
}

function toForm(q: QuoteInput): QuoteForm {
  return {
    id: q.id,
    supplier_name: q.supplier_name,
    item_description: q.item_description ?? "",
    unit_price: money(q.unit_price_paise),
    price_basis: String(q.price_basis ?? 1),
    gst_treatment: q.gst_treatment,
    gst_rate: q.gst_rate_percent != null ? String(q.gst_rate_percent) : "",
    supplier_gstin: q.supplier_gstin ?? "",
    tax_invoice_confirmed: q.tax_invoice_confirmed ?? false,
    freight_treatment: q.freight_treatment,
    freight: money(q.freight_paise),
    other_charges: "",
    moq: q.moq != null ? formatQty(toMilli(q.moq)).replace(/,/g, "") : "",
    pack_size: q.pack_size != null ? String(q.pack_size) : "",
    lead_time_days: q.lead_time_days != null ? String(q.lead_time_days) : "",
    valid_until: q.valid_until ?? "",
    like_for_like: q.like_for_like ?? true,
    like_for_like_note: q.like_for_like_note ?? "",
    confidence: { ...CONFIDENCE[q.id] },
    source: { ...SOURCES[q.id] },
  };
}

export function demoQuoteForms(): QuoteForm[] {
  return [SAMPLE_QUOTE_A, SAMPLE_QUOTE_B, SAMPLE_QUOTE_C].map(toForm);
}
