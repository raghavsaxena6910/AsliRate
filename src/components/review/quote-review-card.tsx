"use client";

import { useId, type ReactNode } from "react";
import { AlertTriangle, Check, ExternalLink } from "lucide-react";
import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/engine/compare";
import type { QuoteField } from "@/lib/engine/schema";
import type { FormErrors, QuoteForm } from "@/lib/review/quote-form";
import { singularUnit } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

export interface SourceFile {
  name: string;
  href: string;
  kind: string;
}

interface Props {
  form: QuoteForm;
  unit: string;
  file?: SourceFile;
  errors?: FormErrors;
  onChange: (next: QuoteForm) => void;
}

export function QuoteReviewCard({ form, unit, file, errors = {}, onChange }: Props) {
  const set = <K extends keyof QuoteForm>(key: K, value: QuoteForm[K], field?: QuoteField) => {
    // Editing a field counts as confirming it.
    const confidence = field ? { ...form.confidence, [field]: 1 } : form.confidence;
    onChange({ ...form, [key]: value, confidence });
  };
  const confirm = (field: QuoteField) => onChange({ ...form, confidence: { ...form.confidence, [field]: 1 } });
  const one = singularUnit(unit);
  const lowCount = Object.values(form.confidence).filter((c) => c != null && c < LOW_CONFIDENCE_THRESHOLD).length;

  const field = (props: Omit<FieldProps, "form" | "onConfirm" | "errors">) => (
    <Field {...props} form={form} errors={errors} onConfirm={confirm} />
  );

  return (
    <article className="rounded-lg border border-line-2 bg-white" aria-label={`Quote from ${form.supplier_name || "supplier"}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{form.supplier_name || "Unnamed supplier"}</h3>
          {file && (
            <a
              href={file.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-carbon hover:underline"
            >
              {file.kind}: {file.name}
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
        {!form.supplier_name.trim() || !form.unit_price.trim() ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-2 px-3 py-1 text-[13px] font-semibold text-amber">
            <AlertTriangle className="size-3.5" aria-hidden />
            Type the numbers
          </span>
        ) : lowCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-2 px-3 py-1 text-[13px] font-semibold text-amber">
            <AlertTriangle className="size-3.5" aria-hidden />
            {lowCount === 1 ? "1 value to check" : `${lowCount} values to check`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stamp-2 px-3 py-1 text-[13px] font-semibold text-stamp">
            <Check className="size-3.5" aria-hidden />
            Ready
          </span>
        )}
      </header>

      <div className="grid gap-x-5 gap-y-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {field({
          label: "Supplier name",
          name: "supplier_name",
          conf: "supplier_name",
          children: (id) => (
            <Input id={id} value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value, "supplier_name")} />
          ),
        })}
        {field({
          label: "Price (₹)",
          name: "unit_price",
          conf: "unit_price_paise",
          children: (id) => (
            <Input
              id={id}
              inputMode="decimal"
              className="num"
              value={form.unit_price}
              onChange={(e) => set("unit_price", e.target.value, "unit_price_paise")}
            />
          ),
        })}
        {field({
          label: `Price is for how many ${unit}`,
          name: "price_basis",
          conf: "price_basis",
          hint: `Usually 1. Use 100 if the rate is per 100 ${unit}.`,
          children: (id) => (
            <Input
              id={id}
              inputMode="decimal"
              className="num"
              value={form.price_basis}
              onChange={(e) => set("price_basis", e.target.value, "price_basis")}
            />
          ),
        })}
        {field({
          label: "GST in the price",
          name: "gst_treatment",
          conf: "gst_treatment",
          group: true,
          children: (id) => (
            <Segmented
              aria-labelledby={id}
              value={form.gst_treatment}
              onValueChange={(v) => set("gst_treatment", v, "gst_treatment")}
              options={[
                { value: "extra", label: "Extra" },
                { value: "included", label: "Included" },
              ]}
            />
          ),
        })}
        {field({
          label: "GST rate (%)",
          name: "gst_rate",
          conf: "gst_rate_percent",
          hint: "Leave blank if the quote doesn't say. We'll assume 18% and flag it.",
          children: (id) => (
            <Input
              id={id}
              inputMode="decimal"
              className="num"
              value={form.gst_rate}
              onChange={(e) => set("gst_rate", e.target.value, "gst_rate_percent")}
            />
          ),
        })}
        {field({
          label: "Supplier GSTIN",
          name: "supplier_gstin",
          conf: "supplier_gstin",
          children: (id) => (
            <>
              <Input
                id={id}
                className="num uppercase"
                maxLength={15}
                value={form.supplier_gstin}
                placeholder="None on the quote"
                onChange={(e) => set("supplier_gstin", e.target.value, "supplier_gstin")}
              />
              {form.supplier_gstin.trim() === "" && (
                <label className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-ink-2">
                  <Checkbox
                    checked={form.tax_invoice_confirmed}
                    onCheckedChange={(v) => set("tax_invoice_confirmed", v === true)}
                    className="mt-px"
                  />
                  Supplier has confirmed they&rsquo;ll issue a GST tax invoice
                </label>
              )}
            </>
          ),
        })}
        {field({
          label: "Freight",
          name: "freight_treatment",
          conf: "freight_treatment",
          group: true,
          children: (id) => (
            <Segmented
              aria-labelledby={id}
              value={form.freight_treatment}
              onValueChange={(v) => set("freight_treatment", v, "freight_treatment")}
              options={[
                { value: "included", label: "Included" },
                { value: "extra", label: "Extra" },
                { value: "not_mentioned", label: "Not stated" },
              ]}
            />
          ),
        })}
        {form.freight_treatment === "extra" &&
          field({
            label: "Freight amount (₹, before GST)",
            name: "freight",
            conf: "freight_paise",
            hint: "Total for this order.",
            children: (id) => (
              <Input
                id={id}
                inputMode="decimal"
                className="num"
                value={form.freight}
                placeholder="Not given"
                onChange={(e) => set("freight", e.target.value, "freight_paise")}
              />
            ),
          })}
        {field({
          label: "Other charges (₹, before GST)",
          name: "other_charges",
          conf: "other_charges",
          hint: "Packing, loading, printing plates.",
          children: (id) => (
            <Input
              id={id}
              inputMode="decimal"
              className="num"
              value={form.other_charges}
              placeholder="None"
              onChange={(e) => set("other_charges", e.target.value, "other_charges")}
            />
          ),
        })}
        {field({
          label: `Minimum order (${unit})`,
          name: "moq",
          conf: "moq",
          children: (id) => (
            <Input
              id={id}
              inputMode="decimal"
              className="num"
              value={form.moq}
              placeholder="None"
              onChange={(e) => set("moq", e.target.value, "moq")}
            />
          ),
        })}
        {field({
          label: `Sold in packs of (${unit})`,
          name: "pack_size",
          conf: "pack_size",
          children: (id) => (
            <Input
              id={id}
              inputMode="decimal"
              className="num"
              value={form.pack_size}
              placeholder={`Any number of ${unit}`}
              onChange={(e) => set("pack_size", e.target.value, "pack_size")}
            />
          ),
        })}
        {field({
          label: "Delivery time (days)",
          name: "lead_time_days",
          conf: "lead_time_days",
          children: (id) => (
            <Input
              id={id}
              inputMode="numeric"
              className="num"
              value={form.lead_time_days}
              placeholder="Not stated"
              onChange={(e) => set("lead_time_days", e.target.value, "lead_time_days")}
            />
          ),
        })}
        {field({
          label: "Quote valid until",
          name: "valid_until",
          conf: "valid_until",
          children: (id) => (
            <Input
              id={id}
              type="date"
              className="num"
              value={form.valid_until}
              onChange={(e) => set("valid_until", e.target.value, "valid_until")}
            />
          ),
        })}
      </div>

      <div className="border-t border-line px-5 py-4">
        <label className="flex items-start gap-2.5 text-[15px] text-ink">
          <Checkbox
            checked={form.like_for_like}
            onCheckedChange={(v) => set("like_for_like", v === true, "item_description")}
            className="mt-0.5"
          />
          <span>
            Same item as I asked for
            {form.item_description && (
              <span className="block text-[13px] text-ink-3">Quoted as: {form.item_description}</span>
            )}
          </span>
        </label>
        {!form.like_for_like && (
          <div className="mt-3 max-w-md">
            <Label htmlFor={`${form.id}-lfl`}>What&rsquo;s different?</Label>
            <Input
              id={`${form.id}-lfl`}
              className="mt-1.5"
              value={form.like_for_like_note}
              placeholder={`e.g. 5-ply instead of 3-ply`}
              onChange={(e) => set("like_for_like_note", e.target.value)}
            />
          </div>
        )}
      </div>
      <p className="sr-only">Prices are per {one} unless the price basis says otherwise.</p>
    </article>
  );
}

interface FieldProps {
  label: string;
  name: keyof QuoteForm;
  conf: QuoteField;
  hint?: string;
  group?: boolean;
  form: QuoteForm;
  errors: FormErrors;
  onConfirm: (field: QuoteField) => void;
  children: (id: string) => ReactNode;
}

function Field({ label, name, conf, hint, group, form, errors, onConfirm, children }: FieldProps) {
  const id = useId();
  const confidence = form.confidence[conf];
  const low = confidence != null && confidence < LOW_CONFIDENCE_THRESHOLD;
  const source = form.source[conf];
  const error = errors[name];
  return (
    <div className={cn("min-w-0", low && "-m-2 rounded-md bg-amber-2 p-2 ring-1 ring-amber/40")}>
      {group ? (
        <span id={id} className="mb-1.5 block text-sm font-medium text-ink-2">
          {label}
        </span>
      ) : (
        <Label htmlFor={id} className="mb-1.5 block">
          {label}
        </Label>
      )}
      {children(id)}
      {error && <p className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>}
      {low && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <span className="font-semibold text-amber">Not sure we read this right</span>
          <button
            type="button"
            onClick={() => onConfirm(conf)}
            className="rounded border border-amber/50 bg-white px-2 py-0.5 font-semibold text-amber hover:bg-amber-2"
          >
            Looks right
          </button>
        </div>
      )}
      {source && <p className="mt-1.5 truncate text-[12.5px] text-ink-3" title={source}>From the quote: {source}</p>}
      {hint && !source && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
    </div>
  );
}
