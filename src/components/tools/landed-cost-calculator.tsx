"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { compareQuotes } from "@/lib/engine/compare";
import { formatINR, formatQty, rupeesToPaise } from "@/lib/engine/money";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";

type YesNo = "yes" | "no";

const num = (s: string) => {
  const n = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** One quote in, real cost out. All maths is done by the same engine the app uses. */
export function LandedCostCalculator() {
  const [unit, setUnit] = useState("pieces");
  const [qty, setQty] = useState("5000");
  const [price, setPrice] = useState("18");
  const [gstRate, setGstRate] = useState("18");
  const [gst, setGst] = useState<"extra" | "included">("extra");
  const [supplierGstin, setSupplierGstin] = useState<YesNo>("yes");
  const [registered, setRegistered] = useState<YesNo>("yes");
  const [freightMode, setFreightMode] = useState<"included" | "extra">("extra");
  const [freight, setFreight] = useState("6000");
  const [moq, setMoq] = useState("");
  const [pack, setPack] = useState("");

  const out = useMemo(() => {
    const need = num(qty);
    if (!need) return { error: "Enter the quantity you need." };
    let pricePaise: number;
    try {
      pricePaise = rupeesToPaise(price);
    } catch {
      return { error: "Enter the price as a number, like 18 or 19.50." };
    }
    let freightPaise: number | null = null;
    if (freightMode === "extra" && freight.trim()) {
      try {
        freightPaise = rupeesToPaise(freight);
      } catch {
        return { error: "Enter freight as a rupee amount, like 6000." };
      }
    }
    try {
      const r = compareQuotes({
        item_description: "Calculator item",
        unit: unit.trim() || "pieces",
        qty_needed: Math.round(need * 1000) / 1000,
        buyer_gst_registered: registered === "yes",
        as_of: "2026-01-01", // only used for validity and deadline checks, which the calculator skips
        quotes: [
          {
            id: "Q",
            supplier_name: "Your supplier",
            unit_price_paise: pricePaise,
            price_basis: 1,
            gst_treatment: gst,
            gst_rate_percent: Number(gstRate),
            supplier_gstin: null,
            tax_invoice_confirmed: supplierGstin === "yes",
            freight_treatment: freightMode === "extra" ? (freightPaise == null ? "not_mentioned" : "extra") : "included",
            freight_paise: freightPaise,
            moq: num(moq),
            pack_size: num(pack),
          },
        ],
      });
      return { result: r.results[0], quoted: pricePaise };
    } catch {
      return { error: "Some of the numbers can't be used. Use at most 3 decimal places for quantities." };
    }
  }, [unit, qty, price, gstRate, gst, supplierGstin, registered, freightMode, freight, moq, pack]);

  const r = "result" in out ? out.result : null;
  const u = unit.trim() || "pieces";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:items-start">
      <form className="grid gap-5 rounded-2xl border border-line-2 bg-white p-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} aria-label="Quote details">
        <Field id="calc-qty" label="Quantity you need">
          <Input id="calc-qty" inputMode="decimal" className="num" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field id="calc-unit" label="Unit">
          <Input id="calc-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pieces, kg, boxes" />
        </Field>
        <Field id="calc-price" label={`Price per ${u.replace(/s$/, "")} (₹)`}>
          <Input id="calc-price" inputMode="decimal" className="num" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field id="calc-rate" label="GST rate">
          <select
            id="calc-rate"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-white px-3 text-[15px] text-ink"
          >
            {["0", "5", "18", "40"].map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </Field>
        <Group label="GST in the price">
          <Segmented aria-label="GST in the price" value={gst} onValueChange={(v) => setGst(v as "extra" | "included")} options={[{ value: "extra", label: "Extra" }, { value: "included", label: "Included" }]} />
        </Group>
        <Group label="Supplier has a GSTIN">
          <Segmented aria-label="Supplier has a GSTIN" value={supplierGstin} onValueChange={(v) => setSupplierGstin(v as YesNo)} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        </Group>
        <Group label="You are GST-registered">
          <Segmented aria-label="You are GST-registered" value={registered} onValueChange={(v) => setRegistered(v as YesNo)} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        </Group>
        <Group label="Freight">
          <Segmented aria-label="Freight" value={freightMode} onValueChange={(v) => setFreightMode(v as "included" | "extra")} options={[{ value: "extra", label: "Extra" }, { value: "included", label: "Included" }]} />
        </Group>
        {freightMode === "extra" && (
          <Field id="calc-freight" label="Freight for the order (₹, before GST)">
            <Input id="calc-freight" inputMode="decimal" className="num" value={freight} placeholder="Not given" onChange={(e) => setFreight(e.target.value)} />
          </Field>
        )}
        <Field id="calc-moq" label={`Minimum order (${u})`}>
          <Input id="calc-moq" inputMode="decimal" className="num" value={moq} placeholder="None" onChange={(e) => setMoq(e.target.value)} />
        </Field>
        <Field id="calc-pack" label={`Sold in packs of (${u})`}>
          <Input id="calc-pack" inputMode="decimal" className="num" value={pack} placeholder="Any number" onChange={(e) => setPack(e.target.value)} />
        </Field>
      </form>

      <section aria-live="polite" aria-label="Result" className="rounded-2xl border-2 border-brand bg-white p-6 lg:sticky lg:top-24">
        {"error" in out ? (
          <p className="text-danger">{out.error}</p>
        ) : (
          r && (
            <>
              <p className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Real cost per {u.replace(/s$/, "")} you need</p>
              <p className="num mt-1 text-[2.6rem] leading-none font-extrabold tracking-[-0.03em] text-brand-deep">
                {formatINR(r.effective_per_unit_paise)}
              </p>
              <p className="mt-2 text-ink-2">
                Quoted at {formatINR(out.quoted!)} {gst === "included" ? "including" : "plus"} GST.
              </p>
              <dl className="mt-5 divide-y divide-line border-y border-line text-[15px]">
                <Row k={`You buy`} v={`${formatQty(r.purchase_qty_milli)} ${u}`} />
                {r.excess_qty_milli > 0 && <Row k="More than you need" v={`${formatQty(r.excess_qty_milli)} ${u} (${formatINR(r.excess_value_paise)})`} />}
                <Row k="Goods before GST" v={formatINR(r.goods_ex_gst_paise)} />
                {r.freight_paise > 0 && <Row k="Freight before GST" v={formatINR(r.freight_paise)} />}
                <Row k={`GST at ${r.gst_rate_percent}%`} v={formatINR(r.gst_paise)} />
                <Row k="You pay the supplier" v={formatINR(r.cash_outlay_paise)} strong />
                <Row k="GST you claim back" v={r.gst_credit_eligible ? `− ${formatINR(r.gst_credit_paise)}` : "None"} />
                <Row k="Real cost of the order" v={formatINR(r.effective_cost_paise)} strong />
              </dl>
              {r.warnings.filter((w) => w.code !== "LOW_CONFIDENCE").length > 0 && (
                <ul className="mt-4 space-y-2">
                  {r.warnings
                    .filter((w) => w.code !== "LOW_CONFIDENCE")
                    .map((w) => (
                      <li key={w.code} className="flex gap-2 rounded-md bg-amber-2 px-3 py-2 text-[14px] text-amber">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {w.message}
                      </li>
                    ))}
                </ul>
              )}
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[15px] text-ink-2">Have quotes from more than one supplier? Upload them all and see them ranked.</p>
                <Button asChild className="mt-3">
                  <Link href="/signup">Compare quotes free</Link>
                </Button>
              </div>
            </>
          )
        )}
      </section>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      {children}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={strong ? "font-semibold text-ink" : "text-ink-2"}>{k}</dt>
      <dd className={`num text-right ${strong ? "font-semibold text-ink" : "text-ink"}`}>{v}</dd>
    </div>
  );
}
