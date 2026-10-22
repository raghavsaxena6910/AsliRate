"use client";

import { useActionState, useState } from "react";
import { saveProfile, type FormState } from "@/lib/auth/actions";
import { BUSINESS_TYPES, BUY_CATEGORIES, HEARD_FROM } from "@/lib/auth/schemas";
import type { Profile } from "@/lib/auth/dal";
import { gstinState, normaliseGstin } from "@/lib/gst";
import { Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "cost", title: "Lowest cost", body: "Price decides almost everything" },
  { value: "balanced", title: "Balanced", body: "Cost first, then delivery and terms" },
  { value: "speed", title: "Fast delivery", body: "Speed matters as much as price" },
] as const;

export function ProfileForm({ profile, firstTime }: { profile: Profile; firstTime: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const e = state.errors ?? {};
  const [notRegistered, setNotRegistered] = useState(!profile.gst_registered);
  const [gstin, setGstin] = useState(profile.gstin ?? "");
  const state_ = gstin ? gstinState(gstin) : null;
  const gstinHint = notRegistered
    ? "GST you pay will be counted as part of the cost."
    : !gstin
      ? "Find it on any GST invoice your business has issued."
      : state_
        ? `Registered in ${state_}. GST on proper tax invoices will be counted as input tax credit.`
        : normaliseGstin(gstin).length >= 15
          ? "That doesn't look like a valid GSTIN."
          : "A GSTIN has 15 characters, like 06ABCDE1234F1Z5.";

  return (
    <form action={action} noValidate className="grid gap-6">
      <FormMessage>{state.message}</FormMessage>
      <Field id="company_name" label="Company name" error={e.company_name}>
        <Input {...fieldProps("company_name", e.company_name)} defaultValue={profile.company_name ?? ""} required />
      </Field>

      <div className="grid gap-3">
        <Field id="gstin" label="GSTIN" error={e.gstin} hint={gstinHint}>
          <Input
            {...fieldProps("gstin", e.gstin, true)}
            className="num uppercase"
            maxLength={15}
            value={gstin}
            onChange={(ev) => setGstin(ev.target.value)}
            disabled={notRegistered}
            placeholder="06ABCDE1234F1Z5"
          />
        </Field>
        <label className="flex items-center gap-2.5 text-[15px] text-ink">
          <input
            type="checkbox"
            name="not_registered"
            className="size-4 accent-[var(--carbon)]"
            checked={notRegistered}
            onChange={(ev) => setNotRegistered(ev.target.checked)}
          />
          We&rsquo;re not GST-registered
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="business_type" label="Business type" error={e.business_type}>
          <select
            {...fieldProps("business_type", e.business_type)}
            defaultValue={profile.business_type ?? "D2C brand"}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-[15px] text-ink"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id="city" label="City" error={e.city}>
          <Input {...fieldProps("city", e.city)} defaultValue={profile.city ?? ""} autoComplete="address-level2" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">What do you usually buy?</legend>
        <div className="flex flex-wrap gap-2">
          {BUY_CATEGORIES.map((c) => (
            <label
              key={c}
              className="cursor-pointer rounded-full border border-line-2 px-3 py-1.5 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-carbon"
            >
              <input
                type="checkbox"
                name="usually_buys"
                value={c}
                defaultChecked={profile.usually_buys.includes(c)}
                className="sr-only"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="cost_of_funds_pct"
        label="What does money cost you? (% a year)"
        error={e.cost_of_funds_pct}
        hint="Your loan or overdraft rate. Used to value advance payments and credit days. If unsure, 12% is a sensible default."
      >
        <Input
          {...fieldProps("cost_of_funds_pct", e.cost_of_funds_pct, true)}
          inputMode="decimal"
          className="num max-w-36"
          defaultValue={String(profile.cost_of_funds_pct)}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">What matters most when choosing a supplier?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRIORITY_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={cn(
                "cursor-pointer rounded-md border border-line-2 px-4 py-3",
                "has-[:checked]:border-carbon has-[:checked]:bg-carbon-2 has-[:checked]:shadow-[inset_0_0_0_1px_var(--carbon)]",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-carbon",
              )}
            >
              <input
                type="radio"
                name="default_priority"
                value={o.value}
                defaultChecked={profile.default_priority === o.value}
                className="sr-only"
              />
              <span className="block font-semibold text-ink">{o.title}</span>
              <span className="text-[13px] text-ink-2">{o.body}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] text-ink-3">You can change this for each comparison.</p>
      </fieldset>

      <Field id="heard_from" label="How did you hear about AsliRate? (optional)">
        <select
          id="heard_from"
          name="heard_from"
          defaultValue={profile.heard_from ?? ""}
          className="h-10 w-full max-w-sm rounded-md border border-input bg-white px-3 text-[15px] text-ink"
        >
          <option value="">Choose one</option>
          {HEARD_FROM.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving" : firstTime ? "Save and continue" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
