import { GSTIN_PATTERN, type QuoteField } from "@/lib/engine/schema";
import type { QuoteForm } from "@/lib/review/quote-form";

/**
 * Rule-based quote reader. No AI, no cost: finds the price, GST, freight,
 * minimum order, delivery time, validity, GSTIN and supplier name in the text
 * of a quote, with a confidence score and the line each value came from.
 *
 * It never calculates anything. Every value it returns is shown on the review
 * screen for the person to confirm before the engine runs.
 */

export type ReadMethod = "pdf" | "excel" | "csv" | "word" | "text" | "manual";

export interface ReadInput {
  /** The document as text lines (PDF, Word, pasted text, or spreadsheet rows joined). */
  lines: string[];
  /** Spreadsheet rows as cells, when the source was a sheet. */
  rows?: string[][];
}

export interface ReadContext {
  /** What the buyer is purchasing, e.g. "3-ply corrugated box 12 x 10 x 8 in". */
  item: string;
  unit: string;
  /** The buyer's own GSTIN, so it isn't mistaken for the supplier's. */
  buyerGstin?: string | null;
  /** Text quotes (WhatsApp) rarely contain a business name; don't guess one from chat. */
  method: ReadMethod;
}

type FormValues = Partial<
  Pick<
    QuoteForm,
    | "supplier_name"
    | "item_description"
    | "unit_price"
    | "price_basis"
    | "gst_treatment"
    | "gst_rate"
    | "supplier_gstin"
    | "freight_treatment"
    | "freight"
    | "moq"
    | "pack_size"
    | "lead_time_days"
    | "valid_until"
  >
>;

export interface ReadResult {
  values: FormValues;
  confidence: Partial<Record<QuoteField, number>>;
  source: Partial<Record<QuoteField, string>>;
  /** Plain-English labels of what was found, for the review screen. */
  found: string[];
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const clip = (s: string, n = 140) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** "1,72,000.00" → "172000.00"; returns null if not a positive number. */
export function cleanNumber(raw: string): string | null {
  const s = raw.replace(/[,\s]/g, "").replace(/\/-$/, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  if (Number(s) <= 0) return null;
  return s;
}

const UNIT_WORDS = [
  "pc", "pcs", "piece", "pieces", "unit", "units", "nos", "no", "each", "box", "boxes", "kg", "kgs",
  "mtr", "mtrs", "metre", "meter", "m", "roll", "rolls", "set", "sets", "pkt", "packet", "packets",
  "bottle", "bottles", "sheet", "sheets", "litre", "liter", "ltr", "pair", "pairs", "dozen", "carton",
  "cartons", "bag", "bags", "label", "labels", "pouch", "pouches", "jar", "jars", "can", "cans", "ream",
];

function unitPattern(unit: string): string {
  const u = unit.trim().toLowerCase();
  const extra = [u, u.replace(/e?s$/, "")].filter((w) => w && /^[a-z]+$/.test(w));
  return [...new Set([...extra, ...UNIT_WORDS])].sort((a, b) => b.length - a.length).join("|");
}

/** Normalise text for matching item descriptions: sizes, ply, words. */
function itemTokens(text: string): Map<string, number> {
  const t = text
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/(\d)\s*(?:in(?:ch(?:es)?)?|mm|cm|")?\s*x\s*(?=\d)/g, "$1x")
    .replace(/(\d+)\s*-?\s*ply/g, "$1ply")
    .replace(/(\d+)\s*-?\s*(gsm|micron|mic)\b/g, "$1$2");
  const STOP = new Set(["the", "and", "with", "for", "inch", "inches", "size", "per", "from", "item", "rate", "qty"]);
  const out = new Map<string, number>();
  for (const tok of t.split(/[^a-z0-9.]+/)) {
    if (!tok || STOP.has(tok)) continue;
    if (/^\d+(\.\d+)?(x\d+(\.\d+)?)+$/.test(tok)) out.set(tok, 3); // size like 12x10x8
    else if (/^\d+ply$/.test(tok) || /^\d+(gsm|micron|mic)$/.test(tok)) out.set(tok, 2);
    else if (/^[a-z]{3,}$/.test(tok)) out.set(tok, 1);
  }
  return out;
}

function overlap(want: Map<string, number>, text: string): number {
  const have = itemTokens(text);
  let score = 0;
  for (const [tok, w] of want) if (have.has(tok)) score += w;
  return score;
}

function titleCaseIfShouting(s: string): string {
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Pvt|Ltd|Llp)\b/g, (m) => m);
  }
  return s;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function isoDate(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return dt.toISOString().slice(0, 10);
}

/** Indian-style dates: 31-03-2027, 31/3/27, 31 Mar 2027, March 31 2027, Mar 2027 (→ month end). */
export function parseDate(text: string): string | null {
  let m = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/.exec(text);
  if (m) return isoDate(+m[3], +m[2], +m[1]);
  m = /\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})[\s,-]+(\d{2,4})\b/i.exec(text);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return isoDate(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  m = /\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i.exec(text);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return isoDate(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  m = /\b([a-z]{3,9})[\s,'-]+(\d{4})\b/i.exec(text);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const last = new Date(Date.UTC(+m[2], month, 0)).getUTCDate();
    return isoDate(+m[2], month, last);
  }
  return null;
}

const VALID_GST_RATES = new Set([0, 0.25, 1.5, 3, 5, 12, 18, 28, 40]);

/* ------------------------------------------------------------------ */
/* main reader                                                         */
/* ------------------------------------------------------------------ */

export function readQuote(input: ReadInput, ctx: ReadContext): ReadResult {
  const lines = input.lines.map((l) => l.replace(/ /g, " ").trim()).filter(Boolean);
  const all = lines.join("\n");
  const values: FormValues = {};
  const confidence: ReadResult["confidence"] = {};
  const source: ReadResult["source"] = {};
  const found: string[] = [];
  const set = <K extends keyof FormValues>(key: K, field: QuoteField, value: FormValues[K], conf: number, src: string) => {
    values[key] = value;
    confidence[field] = conf;
    source[field] = clip(src);
  };
  const want = itemTokens(ctx.item);
  const units = unitPattern(ctx.unit);

  /* ---------- price: spreadsheet table first ---------- */
  let priceLineIdx = -1;
  if (input.rows?.length) {
    const rows = input.rows;
    // A header row has several filled cells and a short "rate/price" column title
    // (not a sheet title like "Kanha Paper Products — Rate List").
    const isPriceHeader = (c: string) =>
      /\b(rate|price|unit\s*cost|cost\s*per)\b/i.test(c) && c.length <= 30 && !/\b(list|valid)\b/i.test(c);
    const headerIdx = rows.findIndex((r) => r.filter(Boolean).length >= 3 && r.some(isPriceHeader));
    if (headerIdx >= 0) {
      const header = rows[headerIdx];
      const priceCol = header.findIndex(isPriceHeader);
      const moqCol = header.findIndex((c) => /\b(moq|min(imum)?\.?\s*(order|qty|quantity))\b/i.test(c));
      const packCol = header.findIndex((c) => /\b(pack|bundle|carton)\s*(size|qty|of)?\b/i.test(c));
      const scored = rows
        .slice(headerIdx + 1)
        .map((r) => ({ r, score: overlap(want, r.join(" ")), price: cleanNumber(r[priceCol] ?? "") }))
        .filter((x) => x.price);
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (best) {
        const unique = scored.length === 1 || (best.score > 0 && best.score > scored[1].score);
        const conf = unique && (best.score >= 2 || scored.length === 1) ? 0.85 : 0.55;
        const rowText = best.r.filter(Boolean).join(" | ");
        set("unit_price", "unit_price_paise", best.price!, conf, `${header[priceCol]}: ${rowText}`);
        const per = /per\s*(\d+)/i.exec(header[priceCol]);
        if (per) set("price_basis", "price_basis", per[1], 0.75, header[priceCol]);
        const desc = best.r.filter((c, i) => i !== priceCol && i !== moqCol && !/^\d+$/.test(c.trim()) && c.trim()).join(", ");
        if (desc) set("item_description", "item_description", clip(desc, 160), conf, rowText);
        if (moqCol >= 0) {
          const moq = cleanNumber(best.r[moqCol] ?? "");
          if (moq) set("moq", "moq", moq, 0.85, `${header[moqCol]}: ${rowText}`);
        }
        if (packCol >= 0) {
          const pack = cleanNumber(best.r[packCol] ?? "");
          if (pack) set("pack_size", "pack_size", pack, 0.7, `${header[packCol]}: ${rowText}`);
        }
        found.push("price");
      }
    }
  }

  /* ---------- price: text lines ---------- */
  if (!values.unit_price) {
    type Cand = { idx: number; price: string; basis?: string; score: number; line: string };
    const cands: Cand[] = [];
    const labelled = new RegExp(
      String.raw`\b(?:rate|price|cost|@)\b\s*(?:\([^)]*\))?\s*[:\-–]?\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:\/-)?\s*(?:(?:per|\/|a)\s*(\d+)?\s*(?:${units})\b)?`,
      "gi",
    );
    const perUnit = new RegExp(
      String.raw`(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:\/-)?\s*(?:rs\.?|rupees)?\s*(?:per|\/|a)\s*(\d+)?\s*(?:${units})\b`,
      "gi",
    );
    const decimalUnit = new RegExp(String.raw`(?:₹|rs\.?\s*)?(\d[\d,]*\.\d{2})\s*(?:\/-)?\s+(?:${units})\b`, "gi");
    lines.forEach((line, idx) => {
      if (/\b(freight|transport|cartage|courier|shipping|advance|total|amount|grand)\b/i.test(line)) return;
      const ctxText = `${lines[idx - 1] ?? ""} ${line}`;
      const fit = overlap(want, ctxText);
      for (const [re, base] of [
        [labelled, 3],
        [perUnit, 3],
        [decimalUnit, 2],
      ] as const) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(line))) {
          const price = cleanNumber(m[1]);
          if (!price) continue;
          cands.push({ idx, price, basis: m[2], score: base + Math.min(fit, 4), line });
        }
      }
    });
    if (cands.length) {
      cands.sort((a, b) => b.score - a.score);
      const best = cands[0];
      const rivals = cands.filter((c) => c.score === best.score && c.price !== best.price);
      const conf = rivals.length === 0 ? (best.score >= 5 ? 0.85 : 0.75) : 0.5;
      set("unit_price", "unit_price_paise", best.price, conf, best.line);
      if (best.basis && Number(best.basis) > 1) set("price_basis", "price_basis", best.basis, 0.75, best.line);
      priceLineIdx = best.idx;
      found.push("price");
    }
  }
  if (priceLineIdx >= 0 && !values.item_description) {
    const prev = lines[priceLineIdx - 1] ?? "";
    const desc = overlap(want, prev) > 0 && !/rate|price|description/i.test(prev) ? `${prev} ${lines[priceLineIdx]}` : lines[priceLineIdx];
    set("item_description", "item_description", clip(desc, 160), 0.75, desc);
  }

  /* ---------- GSTIN ---------- */
  const buyer = (ctx.buyerGstin ?? "").toUpperCase();
  const gstins: { g: string; line: string }[] = [];
  for (const line of lines) {
    for (const m of line.toUpperCase().matchAll(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g)) {
      if (GSTIN_PATTERN.test(m[0]) && m[0] !== buyer && !gstins.some((x) => x.g === m[0])) gstins.push({ g: m[0], line });
    }
  }
  if (gstins.length) {
    set("supplier_gstin", "supplier_gstin", gstins[0].g, gstins.length === 1 ? 0.9 : 0.55, gstins[0].line);
    found.push("GSTIN");
  }

  /* ---------- GST rate ---------- */
  const cgst = /\bcgst\b[^%\n]{0,12}?(\d{1,2}(?:\.\d+)?)\s*%/i.exec(all);
  const sgst = /\b(?:sgst|utgst)\b[^%\n]{0,12}?(\d{1,2}(?:\.\d+)?)\s*%/i.exec(all);
  const gstRate =
    /\b(?:i?gst|tax(?:es)?)\b[^%\n]{0,20}?(\d{1,2}(?:\.\d+)?)\s*%/i.exec(all) ??
    /(\d{1,2}(?:\.\d+)?)\s*%\s*(?:i?gst)\b/i.exec(all);
  if (cgst && sgst) {
    const r = Number(cgst[1]) + Number(sgst[1]);
    if (VALID_GST_RATES.has(r)) set("gst_rate", "gst_rate_percent", String(r), 0.85, `${cgst[0]} + ${sgst[0]}`);
  } else if (gstRate && VALID_GST_RATES.has(Number(gstRate[1]))) {
    const line = lines.find((l) => l.includes(gstRate[0].split("\n")[0])) ?? gstRate[0];
    set("gst_rate", "gst_rate_percent", String(Number(gstRate[1])), 0.85, line);
  }
  if (values.gst_rate) found.push("GST rate");

  /* ---------- GST included or extra ---------- */
  const incl =
    /\b(all[\s-]*inclusive|incl(?:\.|usive|uding)?\s*(?:of\s*)?(?:all\s*)?(?:gst|taxes|tax)|gst\s*incl\w*|with\s*gst|inclusive\s*of\s*(?:all\s*)?(?:gst|taxes))\b/i;
  const extra =
    /(gst[^.\n]{0,25}\b(extra|additional|as\s*applicable|exclusive|excluded)\b|(?:plus|\+)\s*(?:gst|taxes?)\b|exclusive\s*of\s*(?:gst|tax\w*)|\bex[-\s]?gst\b|\btax(?:es)?\s*(?:extra|as\s*applicable)\b)/i;
  const inclLine = lines.find((l) => incl.test(l));
  const extraLine = lines.find((l) => extra.test(l));
  if (inclLine && !extraLine) set("gst_treatment", "gst_treatment", "included", 0.8, inclLine);
  else if (extraLine && !inclLine) set("gst_treatment", "gst_treatment", "extra", 0.85, extraLine);
  else if (inclLine && extraLine) set("gst_treatment", "gst_treatment", "extra", 0.5, `${extraLine} / ${inclLine}`);
  else set("gst_treatment", "gst_treatment", "extra", 0.5, "The quote doesn't say whether GST is included");
  if (inclLine || extraLine) found.push("GST included/extra");

  /* ---------- freight ---------- */
  const freightKw = /\b(freight|transport(?:ation)?|cartage|shipping|courier|delivery\s*charges?|logistics)\b/i;
  const money = /(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d{1,2})?)|(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)(?:\s*\/-)?|(\d+(?:\.\d{1,2})?)\s*\/-/i;
  const freightLine = lines.find((l) => freightKw.test(l));
  if (freightLine) {
    const amt = money.exec(freightLine);
    const amount = amt ? cleanNumber(amt[1] ?? amt[2] ?? amt[3]) : null;
    if (/\b(free|included|inclusive|incl\.?|paid\s*by\s*(us|supplier)|nil|f\.?o\.?r\.?\s*(destination|site|your))\b/i.test(freightLine) && !amount) {
      set("freight_treatment", "freight_treatment", "included", 0.8, freightLine);
    } else if (amount) {
      set("freight_treatment", "freight_treatment", "extra", 0.85, freightLine);
      set("freight", "freight_paise", amount, 0.85, freightLine);
    } else {
      set("freight_treatment", "freight_treatment", "extra", 0.75, freightLine);
    }
    found.push("freight");
  } else {
    const deliveredLine = lines.find((l) =>
      /(\+\s*delivery|incl\w*\s*(of\s*)?delivery|free\s*delivery|delivery\s*free|door\s*delivery|delivered\s*(to|at|price|rate)|ex[-\s]?works|ex[-\s]?factory)/i.test(l),
    );
    if (deliveredLine) {
      const exWorks = /ex[-\s]?(works|factory)/i.test(deliveredLine);
      set("freight_treatment", "freight_treatment", exWorks ? "extra" : "included", 0.7, deliveredLine);
      found.push("freight");
    }
  }

  /* ---------- minimum order and pack size ---------- */
  if (!values.moq) {
    const m = /\b(?:moq|min(?:imum)?\.?\s*(?:order)?\s*(?:qty|quantity)?|minimum\s+order(?:\s+quantity)?)\b\s*(?:is|of|:|-|–)?\s*(\d[\d,]*)/i.exec(all);
    if (m) {
      const moq = cleanNumber(m[1]);
      const line = lines.find((l) => l.includes(m[0].split("\n")[0])) ?? m[0];
      if (moq) set("moq", "moq", moq, 0.85, line);
    }
  }
  if (values.moq) found.push("minimum order");
  if (!values.pack_size) {
    const m = /\b(?:packs?|bundles?|cartons?|bales?|packed)\s*(?:of|in|size)\s*:?\s*(\d[\d,]*)/i.exec(all);
    const pack = m ? cleanNumber(m[1]) : null;
    if (m && pack) set("pack_size", "pack_size", pack, 0.6, lines.find((l) => l.includes(m[0])) ?? m[0]);
  }

  /* ---------- delivery time ---------- */
  for (const line of lines) {
    if (/\b(payment|credit|valid|warranty|guarantee)\b/i.test(line)) continue;
    if (!/\b(deliver\w*|dispatch\w*|lead\s*time|ready|supply|ship\w*|within|tat)\b/i.test(line)) continue;
    const m = /(\d{1,3})\s*(?:-\s*\d{1,3}\s*)?(working\s*)?(days?|weeks?|wks?)\b/i.exec(line);
    if (!m) continue;
    const days = /w/i.test(m[3]) ? Number(m[1]) * 7 : Number(m[1]);
    const firm = /\b(deliver\w*|lead\s*time|within)\b/i.test(line) && !/\b(dispatch|ready)\b/i.test(line);
    set("lead_time_days", "lead_time_days", String(days), firm ? 0.85 : 0.6, line);
    found.push("delivery time");
    break;
  }

  /* ---------- validity ---------- */
  for (const line of lines) {
    if (!/\bvalid/i.test(line)) continue;
    const d = parseDate(line);
    if (d) {
      set("valid_until", "valid_until", d, 0.85, line);
      found.push("validity");
      break;
    }
  }

  /* ---------- supplier name ---------- */
  const BUSINESS =
    /\b(packag\w*|products?|industr\w*|enterprises?|traders?|trading|pvt|private|ltd|limited|llp|corporation|corp|agenc\w*|works|mills?|corrugat\w*|plast\w*|print\w*|& sons|company|exports?|impex|solutions|suppl\w*|manufactur\w*|udyog|udhyog)\b/i;
  const SKIP =
    /(quotation|quote|invoice|proforma|estimate|\bdate\b|\bref\b|gstin|gst\s*no|\bph\b|phone|mobile|email|@|www\.|^to,?$|dear|plot|sector|road|street|nagar|^\d|terms|s\.?\s*no|subject|kind\s*attn|sample document)/i;
  const forLine = lines.map((l) => /^for\s+(.{3,60})$/i.exec(l)).find((m) => m && BUSINESS.test(m[1]));
  if (forLine) {
    set("supplier_name", "supplier_name", titleCaseIfShouting(forLine[1].trim()), 0.85, forLine[0]);
  } else {
    const head = (input.rows?.length ? input.rows.map((r) => r.filter(Boolean).join(" ")) : lines).slice(0, 10);
    const cleaned = head
      .map((l) => l.replace(/\s*[—–|:-]\s*(rate\s*list|price\s*list|quotation|quote|rates?)\b.*$/i, "").trim())
      .filter((l) => l.length >= 3 && l.length <= 70 && /[a-z]/i.test(l) && !SKIP.test(l));
    const biz = cleaned.find((l) => BUSINESS.test(l));
    if (biz) set("supplier_name", "supplier_name", titleCaseIfShouting(biz), 0.8, biz);
    else if (cleaned[0] && ctx.method !== "text") set("supplier_name", "supplier_name", titleCaseIfShouting(cleaned[0]), 0.5, cleaned[0]);
  }
  if (values.supplier_name) found.unshift("supplier name");

  return { values, confidence, source, found };
}

/** A blank review form, for quotes that need typing in. */
export function blankQuoteForm(id: string): QuoteForm {
  return {
    id,
    supplier_name: "",
    item_description: "",
    unit_price: "",
    price_basis: "1",
    gst_treatment: "extra",
    gst_rate: "",
    supplier_gstin: "",
    tax_invoice_confirmed: false,
    freight_treatment: "not_mentioned",
    freight: "",
    other_charges: "",
    moq: "",
    pack_size: "",
    lead_time_days: "",
    valid_until: "",
    like_for_like: true,
    like_for_like_note: "",
    confidence: {},
    source: {},
  };
}

/** Apply a reader result to a blank form. */
export function toQuoteForm(id: string, r: ReadResult): QuoteForm {
  return { ...blankQuoteForm(id), ...r.values, confidence: { ...r.confidence }, source: { ...r.source } };
}
