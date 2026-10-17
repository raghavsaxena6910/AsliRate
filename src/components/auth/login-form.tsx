"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type FormState } from "@/lib/auth/actions";
import { Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NOTICES: Record<string, string> = {
  confirmed: "Your email is confirmed. Log in to continue.",
  "link-expired": "That link has expired or was already used. Log in, or sign up again to get a new one.",
};

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const e = state.errors ?? {};
  const notice = NOTICES[params.get("notice") ?? ""];

  return (
    <form action={action} noValidate className="grid gap-5">
      {notice && !state.message && (
        <p role="status" className="rounded-md bg-carbon-2 px-4 py-3 text-[15px] text-carbon">
          {notice}
        </p>
      )}
      <FormMessage>{state.message}</FormMessage>
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <Field id="email" label="Email" error={e.email}>
        <Input
          {...fieldProps("email", e.email)}
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
        />
      </Field>
      <Field id="password" label="Password" error={e.password}>
        <Input {...fieldProps("password", e.password)} type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Logging in" : "Log in"}
        </Button>
        <p className="text-sm text-ink-3">
          New to AsliRate?{" "}
          <Link href="/signup" className="font-semibold text-carbon hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}
