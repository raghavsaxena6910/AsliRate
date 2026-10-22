"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Link2, Printer, Trash2 } from "lucide-react";
import { deleteComparison, setSharing } from "@/lib/comparisons/actions";
import { Button } from "@/components/ui/button";

/** Share link, Excel download, print and delete for one finished comparison. */
export function ResultActions({ comparisonId, initialToken }: { comparisonId: string; initialToken: string | null }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  const link = token ? `https://www.aslirate.in/s/${token}` : null;

  function share(on: boolean) {
    setMessage(null);
    start(async () => {
      const res = await setSharing(comparisonId, on);
      if (!res.ok) return setMessage(res.message);
      setToken(res.token);
      setCopied(false);
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setMessage("Couldn't copy. Select the link and copy it yourself.");
    }
  }

  function remove() {
    start(async () => {
      const res = await deleteComparison(comparisonId);
      if (!res.ok) return setMessage(res.message);
      router.push("/dashboard");
    });
  }

  return (
    <section aria-labelledby="share-heading" className="print:hidden rounded-xl border border-line-2 p-5 sm:p-6">
      <h2 id="share-heading" className="text-lg font-bold text-ink">
        Share or save these results
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`/comparisons/${comparisonId}/export`} download>
            <Download aria-hidden /> Download Excel
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer aria-hidden /> Print or save as PDF
        </Button>
        {!token && (
          <Button variant="outline" size="sm" onClick={() => share(true)} disabled={pending}>
            <Link2 aria-hidden /> Create a share link
          </Button>
        )}
      </div>

      {link && (
        <div className="mt-4 rounded-lg bg-paper-2 p-4">
          <p className="text-sm text-ink-2">
            Anyone with this link can see these results, including supplier names and prices. They can&rsquo;t see your
            uploaded files or change anything.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={link}
              aria-label="Share link"
              onFocus={(e) => e.currentTarget.select()}
              className="num h-9 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-sm text-ink"
            />
            <Button size="sm" onClick={copy}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? "Copied" : "Copy link"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => share(false)} disabled={pending}>
              Turn off link
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[15px] text-ink">Delete this comparison, its quotes and uploaded files? This can&rsquo;t be undone.</p>
            <Button size="sm" variant="outline" className="border-danger text-danger hover:bg-danger-2" onClick={remove} disabled={pending}>
              Yes, delete it
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-danger">
            <Trash2 className="size-4" aria-hidden /> Delete this comparison
          </button>
        )}
      </div>
      {message && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {message}
        </p>
      )}
    </section>
  );
}
