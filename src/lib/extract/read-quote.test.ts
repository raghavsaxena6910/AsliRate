import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR } from "@/lib/engine/money";
import { formToQuoteInput } from "@/lib/review/quote-form";
import { fileToText, parseCsv } from "./files";
import { parseDate, readQuote, toQuoteForm, type ReadContext } from "./read-quote";

const CTX: Omit<ReadContext, "method"> = {
  item: "3-ply corrugated shipping box, 12 × 10 × 8 in, brown kraft",
  unit: "boxes",
  buyerGstin: "06AAGCG5521R1ZK",
};

const bytes = (path: string) => {
  const b = readFileSync(path);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

async function readFile(path: string, name: string) {
  const t = await fileToText(name, null, bytes(path));
  return { t, r: readQuote(t.input, { ...CTX, method: t.method }) };
}

const WHATSAPP = `Hi, need rate for 3 ply box 12x10x8, approx 5000 pcs. Delivery Gurugram
Ji sir
12x10x8 3 ply brown — 19.50 per box all inclusive (GST 18% + delivery)
ready in 1 week
GST no. 07BHKPR2219M1ZX
Ok thanks, will confirm by today`;

describe("reading sample quote A (PDF)", async () => {
  const { t, r } = await readFile("public/samples/quote-A-shree-balaji.pdf", "quote.pdf");
  it("is read as a PDF", () => expect(t.method).toBe("pdf"));
  it("finds every term", () => {
    expect(r.values).toMatchObject({
      supplier_name: "Shree Balaji Packaging",
      unit_price: "18.00",
      gst_treatment: "extra",
      gst_rate: "18",
      supplier_gstin: "06AAPFS4721K1ZU",
      freight_treatment: "extra",
      freight: "6000",
      moq: "2000",
      lead_time_days: "10",
      valid_until: "2027-03-31",
    });
  });
  it("is confident about the price and quotes its source line", () => {
    expect(r.confidence.unit_price_paise).toBeGreaterThanOrEqual(0.7);
    expect(r.source.unit_price_paise).toContain("18.00 Box");
  });
});

describe("reading sample quote C (Excel)", async () => {
  const { t, r } = await readFile("public/samples/quote-C-kanha-rate-list.xlsx", "rates.xlsx");
  it("is read as a spreadsheet", () => expect(t.method).toBe("excel"));
  it("picks the 3-ply 12x10x8 row, not the 5-ply or other sizes", () => {
    expect(r.values.unit_price).toBe("17.2");
    expect(r.values.moq).toBe("10000");
    expect(r.confidence.unit_price_paise).toBeGreaterThanOrEqual(0.7);
  });
  it("finds the terms", () => {
    expect(r.values).toMatchObject({
      supplier_name: "Kanha Paper Products",
      supplier_gstin: "09AAJCK8834D1Z9",
      gst_treatment: "extra",
      gst_rate: "18",
      freight_treatment: "extra",
      freight: "9000",
      lead_time_days: "14",
      valid_until: "2027-03-31",
    });
  });
  it("flags 'dispatch in 2 weeks' for checking", () => {
    expect(r.confidence.lead_time_days).toBeLessThan(0.7);
  });
});

describe("reading sample quote B (pasted WhatsApp text)", () => {
  const r = readQuote({ lines: WHATSAPP.split("\n") }, { ...CTX, method: "text" });
  it("finds price, GST and freight in chat text", () => {
    expect(r.values).toMatchObject({
      unit_price: "19.50",
      gst_treatment: "included",
      gst_rate: "18",
      supplier_gstin: "07BHKPR2219M1ZX",
      freight_treatment: "included",
      lead_time_days: "7",
    });
  });
  it("doesn't invent a supplier name from chat", () => {
    expect(r.values.supplier_name).toBeUndefined();
  });
});

describe("read quotes give the reference result once confirmed", async () => {
  const a = await readFile("public/samples/quote-A-shree-balaji.pdf", "a.pdf");
  const c = await readFile("public/samples/quote-C-kanha-rate-list.xlsx", "c.xlsx");
  const b = readQuote({ lines: WHATSAPP.split("\n") }, { ...CTX, method: "text" });
  it("ranks B, A, C with the reference real costs", () => {
    const forms = [toQuoteForm("A", a.r), { ...toQuoteForm("B", b), supplier_name: "Om Corrugators" }, toQuoteForm("C", c.r)];
    const quotes = forms.map((f) => {
      const res = formToQuoteInput(f);
      if (!res.ok) throw new Error(JSON.stringify(res.errors));
      return { ...res.quote, field_confidence: {} };
    });
    const result = compareQuotes({
      item_description: CTX.item,
      unit: "boxes",
      qty_needed: 5000,
      buyer_gst_registered: true,
      as_of: "2026-10-17",
      quotes,
    });
    expect(result.results.map((x) => [x.quote_id, formatINR(x.effective_cost_paise)])).toEqual([
      ["B", "₹82,627.12"],
      ["A", "₹96,000.00"],
      ["C", "₹1,81,000.00"],
    ]);
  });
});

describe("reader rules", () => {
  const read = (text: string, method: ReadContext["method"] = "text") => readQuote({ lines: text.split("\n") }, { ...CTX, method });

  it("adds CGST and SGST", () => expect(read("Rate 18.00 per box\nCGST 9% SGST 9% extra").values.gst_rate).toBe("18"));
  it("ignores impossible GST rates", () => expect(read("Rate 18.00 per box\nGST 17% extra").values.gst_rate).toBeUndefined());
  it("understands price per 100", () => {
    const r = read("Rate: Rs. 1,800 per 100 boxes + GST");
    expect(r.values.unit_price).toBe("1800");
    expect(r.values.price_basis).toBe("100");
    expect(r.values.gst_treatment).toBe("extra");
  });
  it("doesn't take the freight amount as the price", () => {
    const r = read("Freight ₹6,000 extra\n18.50 per box + GST");
    expect(r.values.unit_price).toBe("18.50");
    expect(r.values.freight).toBe("6000");
  });
  it("treats free delivery as included", () => expect(read("Rate 12/- per pc\nFreight: free").values.freight_treatment).toBe("included"));
  it("doesn't read payment days as delivery time", () => {
    const r = read("Payment within 30 days\nDelivery within 5 days");
    expect(r.values.lead_time_days).toBe("5");
  });
  it("skips the buyer's own GSTIN", () => {
    const r = read("Bill to GSTIN 06AAGCG5521R1ZK\nOur GSTIN 07BHKPR2219M1ZX");
    expect(r.values.supplier_gstin).toBe("07BHKPR2219M1ZX");
  });
  it("marks ambiguous prices for checking", () => {
    const r = read("Rate 18.00 per box\nRate 22.00 per box", "pdf");
    expect(r.confidence.unit_price_paise).toBeLessThan(0.7);
  });
  it("defaults GST to extra but flags it when the quote is silent", () => {
    const r = read("Rate 18.00 per box");
    expect(r.values.gst_treatment).toBe("extra");
    expect(r.confidence.gst_treatment).toBeLessThan(0.7);
  });

  it.each([
    ["Valid till 31-03-2027", "2027-03-31"],
    ["valid upto 5/1/27", "2027-01-05"],
    ["Valid until 15th April 2027", "2027-04-15"],
    ["Rates valid up to Mar 2027", "2027-03-31"],
    ["valid till 31-02-2027", null],
  ])("parses %j", (text, iso) => expect(parseDate(text)).toBe(iso));

  it("parses CSV with quotes", () => {
    expect(parseCsv('Item,Rate\n"Box, 3 ply",17.20\n')).toEqual([
      ["Item", "Rate"],
      ["Box, 3 ply", "17.20"],
    ]);
  });
});

describe("files we can't read", () => {
  it("asks for typing on images", async () => {
    const t = await fileToText("WhatsApp Image.png", "image/png", new ArrayBuffer(8));
    expect(t.method).toBe("manual");
    expect(t.problem).toContain("type the numbers");
  });
  it("suggests saving old .xls as .xlsx", async () => {
    const t = await fileToText("rates.xls", null, new ArrayBuffer(8));
    expect(t.problem).toContain(".xlsx");
  });
  it("survives a corrupt PDF", async () => {
    const t = await fileToText("broken.pdf", "application/pdf", new TextEncoder().encode("not a pdf").buffer as ArrayBuffer);
    expect(t.method).toBe("manual");
  });
});
