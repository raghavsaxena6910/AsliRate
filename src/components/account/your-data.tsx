"use client";

import { useActionState, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { deleteAccount, type DeleteState } from "@/lib/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Export or delete everything AsliRate holds about this account. */
export function YourData() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});

  return (
    <section aria-labelledby="your-data" className="mt-14 border-t border-line pt-10">
      <h2 id="your-data" className="text-xl font-bold text-ink">
        Your data
      </h2>
      <p className="mt-2 max-w-[60ch] leading-relaxed text-ink-2">
        Download a copy of everything AsliRate holds about you: company details, comparisons, the numbers you confirmed,
        and results.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <a href="/account/export" download>
          <Download aria-hidden /> Download my data
        </a>
      </Button>

      <div className="mt-10 rounded-xl border border-danger/30 p-5">
        <h3 className="font-bold text-ink">Delete my account</h3>
        <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
          Permanently deletes your login, company details, every comparison and result, and all uploaded quote files. This
          can&rsquo;t be undone. Payment records stay with Dodo Payments, as the law requires.
        </p>
        {!open ? (
          <Button variant="outline" size="sm" className="mt-4 border-danger text-danger hover:bg-danger-2" onClick={() => setOpen(true)}>
            <Trash2 aria-hidden /> Delete my account
          </Button>
        ) : (
          <form action={action} className="mt-4 grid max-w-sm gap-3">
            <label htmlFor="confirm-delete" className="text-sm font-medium text-ink">
              Type <span className="num font-bold">DELETE</span> to confirm
            </label>
            <Input id="confirm-delete" name="confirm" autoComplete="off" aria-invalid={state.message ? true : undefined} aria-describedby={state.message ? "delete-error" : undefined} />
            {state.message && (
              <p id="delete-error" role="alert" className="text-[14px] font-medium text-danger">
                {state.message}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" className="bg-danger hover:bg-danger/90" disabled={pending}>
                {pending ? "Deleting…" : "Delete everything"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Keep my account
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
