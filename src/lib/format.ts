import { formatINR, formatQty, toMilli } from "@/lib/engine/money";
import type { QuoteInput } from "@/lib/engine/schema";

const SINGULAR_EXCEPTIONS: Record<string, string> = {
  kg: "kg",
  kgs: "kg",
  g: "g",
  m: "m",
  mtr: "m",
  pcs: "pc",
  nos: "no.",
  litres: "litre",
  liters: "liter",
};

/** "boxes" → "box", "rolls" → "roll", "bottles" → "bottle", "kg" → "kg". */
export function singularUnit(unit: string): string {
  const u = unit.trim();
  const lower = u.toLowerCase();
  if (SINGULAR_EXCEPTIONS[lower]) return SINGULAR_EXCEPTIONS[lower];
  if (/(x|ch|sh|ss)es$/i.test(u)) return u.slice(0, -2);
  if (/[^aeiou]ies$/i.test(u)) return `${u.slice(0, -3)}y`;
  if (/s$/i.test(u) && !/ss$/i.test(u)) return u.slice(0, -1);
  return u;
}

/** How the supplier quoted it, in their terms: "₹18.00 per box + GST, freight ₹6,000.00 extra". */
export function describeQuotedRate(q: QuoteInput, unit: string): string {
  const basis = q.price_basis ?? 1;
  const per = basis === 1 ? `per ${singularUnit(unit)}` : `per ${formatQty(toMilli(basis))} ${unit}`;
  const gst = q.gst_treatment === "included" ? "GST incl." : "+ GST";
  let freight = "";
  if (q.freight_treatment === "included") freight = ", delivered";
  else if (q.freight_treatment === "extra")
    freight = q.freight_paise != null ? `, freight ${formatINR(q.freight_paise)} extra` : ", freight extra";
  return `${formatINR(q.unit_price_paise)} ${per} ${gst}${freight}`;
}

/** Quoted price of a single unit, for sorting by sticker price. Not used for any money shown as cost. */
export function quotedUnitPrice(q: QuoteInput): number {
  return q.unit_price_paise / (q.price_basis ?? 1);
}

/** Today's date in India as YYYY-MM-DD. */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}
