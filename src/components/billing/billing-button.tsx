"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { BillingState } from "@/lib/billing/actions";
import { track, type AnalyticsEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export function BillingButton({
  action,
  label,
  variant = "default",
  event,
}: {
  event?: AnalyticsEvent;
  action: (prev: BillingState, form: FormData) => Promise<BillingState>;
  label: string;
  variant?: "default" | "outline";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} onSubmit={() => event && track(event)}>
      <Button type="submit" size="lg" variant={variant} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden /> Opening secure page
          </>
        ) : (
          label
        )}
      </Button>
      {state.message && (
        <p role="alert" className="mt-3 text-[15px] font-medium text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
