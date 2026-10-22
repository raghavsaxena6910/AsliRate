"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteComparison } from "@/lib/comparisons/actions";

/** Small delete control for a dashboard row, with an inline confirm step. */
export function DeleteRowButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);

  if (confirming) {
    return (
      <span className="relative z-10 flex items-center gap-2 text-[13px]">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteComparison(id);
              if (!res.ok) return setError(true);
              router.refresh();
            })
          }
          className="rounded-md border border-danger px-2 py-1 font-semibold text-danger hover:bg-danger-2"
        >
          {pending ? "Deleting" : error ? "Try again" : "Delete"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-2 py-1 text-ink-3 hover:text-ink">
          Cancel
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="relative z-10 rounded-md p-1.5 text-ink-3 hover:bg-white hover:text-danger"
      aria-label={`Delete ${label}`}
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
