"use client";

import { useActionState } from "react";
import { createComparison, type NewComparisonState } from "@/lib/comparisons/actions";
import { Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

export function NewComparisonForm({ gstRegistered }: { gstRegistered: boolean }) {
  const [state, action, pending] = useActionState<NewComparisonState, FormData>(createComparison, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} noValidate className="grid gap-6" onSubmit={() => track("comparison_started")}>
      <FormMessage>{state.message}</FormMessage>
      <Field id="item_description" label="What are you buying?" error={e.item_description}>
        <Input
          {...fieldProps("item_description", e.item_description)}
          defaultValue={v.item_description}
          placeholder="Shipping box, 3-ply corrugated"
          required
        />
      </Field>
      <Field
        id="specification"
        label="Specification (optional)"
        error={e.specification}
        hint="Size, material, grade, finish. It helps us find the right line in a supplier's rate list."
      >
        <textarea
          {...fieldProps("specification", e.specification, true)}
          defaultValue={v.specification}
          rows={2}
          placeholder="12 × 10 × 8 in, brown kraft, 150 GSM"
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30"
        />
      </Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field id="qty_needed" label="Quantity" error={e.qty_needed}>
          <Input {...fieldProps("qty_needed", e.qty_needed)} inputMode="decimal" className="num" defaultValue={v.qty_needed} placeholder="5000" required />
        </Field>
        <Field id="unit" label="Unit" error={e.unit}>
          <Input {...fieldProps("unit", e.unit)} defaultValue={v.unit} placeholder="boxes" required />
        </Field>
        <Field id="required_by" label="Needed by (optional)" error={e.required_by}>
          <Input {...fieldProps("required_by", e.required_by)} type="date" defaultValue={v.required_by} />
        </Field>
      </div>
      <Field id="deliver_to" label="Deliver to (optional)" error={e.deliver_to}>
        <Input {...fieldProps("deliver_to", e.deliver_to)} defaultValue={v.deliver_to} placeholder="Udyog Vihar Phase IV, Gurugram" />
      </Field>
      <label className="flex items-start gap-2.5 rounded-md border border-line-2 p-4 text-[15px] text-ink">
        <input type="checkbox" name="buyer_gst_registered" defaultChecked={gstRegistered} className="mt-1 size-4 accent-[var(--brand)]" />
        <span>
          Buying as a GST-registered business
          <span className="block text-[13px] text-ink-3">GST on a proper tax invoice then comes back to you as input tax credit.</span>
        </span>
      </label>
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating" : "Continue to quotes"}
        </Button>
      </div>
    </form>
  );
}
