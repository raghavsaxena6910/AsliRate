import ExcelJS from "exceljs";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dal";
import { compareQuotes, formatDate } from "@/lib/engine/compare";
import { formatQty } from "@/lib/engine/money";
import type { ComparisonInput } from "@/lib/engine/schema";
import { createClient } from "@/lib/supabase/server";

/** Indian digit grouping (1,81,000.00) for rupee cells. */
const INR = '[>=10000000]"₹"##\\,##\\,##\\,##0.00;[>=100000]"₹"##\\,##\\,##0.00;"₹"##,##0.00';
const rupees = (paise: number) => paise / 100;

/** Download a finished comparison as an Excel workbook. Signed-in owner only (row-level security). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  if (!(await getCurrentUser())) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase.from("results").select("engine_input").eq("comparison_id", id).maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });
  const result = compareQuotes(data.engine_input as ComparisonInput);
  const { input } = result;

  const wb = new ExcelJS.Workbook();
  wb.creator = "AsliRate";
  const ws = wb.addWorksheet("Ranking", { views: [{ state: "frozen", ySplit: 5 }] });
  ws.addRow([`AsliRate comparison: ${input.item_description}`]).font = { bold: true, size: 14 };
  ws.addRow([
    `Need ${formatQty(result.qty_needed_milli)} ${input.unit} · Compared on ${formatDate(input.as_of)} · Buyer ${input.buyer_gst_registered ? "is" : "is not"} GST-registered`,
  ]);
  ws.addRow(["Real cost = what the order costs after GST you can claim back. Calculated by AsliRate (www.aslirate.in)."]).font = {
    italic: true,
    color: { argb: "FF64736B" },
  };
  ws.addRow([]);
  const head = ws.addRow([
    "Rank",
    "Supplier",
    `You buy (${input.unit})`,
    "Goods before GST",
    "Freight",
    "Other charges",
    "Subtotal before GST",
    "GST",
    "You pay the supplier",
    "GST credit",
    "Real cost",
    "Real rate per unit needed",
    "More than the best",
    "Checks",
  ]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF087A37" } }));

  for (const r of result.results) {
    const row = ws.addRow([
      r.rank,
      r.supplier_name,
      r.purchase_qty_milli / 1000,
      rupees(r.goods_ex_gst_paise),
      rupees(r.freight_paise),
      rupees(r.other_charges_paise),
      rupees(r.subtotal_ex_gst_paise),
      rupees(r.gst_paise),
      rupees(r.cash_outlay_paise),
      r.gst_credit_eligible ? rupees(r.gst_credit_paise) : 0,
      rupees(r.effective_cost_paise),
      rupees(r.effective_per_unit_paise),
      rupees(r.difference_from_best_paise),
      r.warnings.map((w) => w.message).join(" "),
    ]);
    for (let c = 4; c <= 13; c++) row.getCell(c).numFmt = INR;
    if (r.rank === 1) row.font = { bold: true };
  }
  ws.columns.forEach((col, i) => (col.width = i === 1 ? 28 : i === 13 ? 60 : 16));
  ws.getColumn(14).alignment = { wrapText: true, vertical: "top" };

  const q = wb.addWorksheet("Quotes as confirmed");
  q.addRow(["Supplier", "Price", "Price is for", "GST", "GST rate %", "Supplier GSTIN", "Freight", "Freight amount", "Minimum order", "Pack size", "Delivery days", "Valid until"]).font = {
    bold: true,
  };
  for (const x of input.quotes) {
    const row = q.addRow([
      x.supplier_name,
      rupees(x.unit_price_paise),
      x.price_basis,
      x.gst_treatment,
      x.gst_rate_percent ?? "not stated",
      x.supplier_gstin ?? "",
      x.freight_treatment.replace("_", " "),
      x.freight_paise == null ? "" : rupees(x.freight_paise),
      x.moq ?? "",
      x.pack_size ?? "",
      x.lead_time_days ?? "",
      x.valid_until ?? "",
    ]);
    row.getCell(2).numFmt = INR;
    row.getCell(8).numFmt = INR;
  }
  q.columns.forEach((col, i) => (col.width = i === 0 ? 28 : 15));

  const buf = await wb.xlsx.writeBuffer();
  const name = `aslirate-${input.item_description.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40).replace(/-$/, "")}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
