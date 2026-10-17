"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { signup, type FormState } from "@/lib/auth/actions";
import { Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.checkEmail) {
    return (
      <div role="status" className="rounded-lg border border-line-2 p-6">
        <MailCheck className="size-8 text-stamp" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-ink">Check your email</h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          We sent a confirmation link to <span className="font-semibold text-ink">{state.checkEmail}</span>. Open it on
          this device to finish creating your account. It can take a minute; check spam if it doesn&rsquo;t arrive.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage>{state.message}</FormMessage>
      <Field id="full_name" label="Your name" error={e.full_name}>
        <Input {...fieldProps("full_name", e.full_name)} autoComplete="name" defaultValue={v.full_name} required />
      </Field>
      <Field id="email" label="Work email" error={e.email}>
        <Input {...fieldProps("email", e.email)} type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      <Field id="company_name" label="Company name" error={e.company_name}>
        <Input
          {...fieldProps("company_name", e.company_name)}
          autoComplete="organization"
          defaultValue={v.company_name}
          required
        />
      </Field>
      <Field id="password" label="Password" error={e.password} hint="At least 8 characters.">
        <Input {...fieldProps("password", e.password, true)} type="password" autoComplete="new-password" required />
      </Field>
      <div>
        <label className="flex items-start gap-2.5 text-[15px] text-ink">
          <input
            type="checkbox"
            name="agree"
            className="mt-1 size-4 accent-[var(--carbon)]"
            aria-invalid={e.agree ? true : undefined}
            aria-describedby={e.agree ? "agree-error" : undefined}
          />
          <span>I agree to the terms of use and privacy policy.</span>
        </label>
        {e.agree && (
          <p id="agree-error" className="mt-1.5 text-[13px] font-medium text-danger">
            {e.agree}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating account" : "Create account"}
        </Button>
        <p className="text-sm text-ink-3">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-carbon hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
