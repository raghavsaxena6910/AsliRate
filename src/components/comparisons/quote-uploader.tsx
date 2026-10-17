"use client";

import { useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Type, Upload, X } from "lucide-react";
import { addFileQuote, addTextQuote, readQuotes, removeQuote } from "@/lib/comparisons/actions";
import { MAX_FILE_BYTES, MAX_QUOTES, MIN_QUOTES } from "@/lib/comparisons/schemas";
import { ACCEPTED_EXTENSIONS, extensionOf, kindOf, mimeFor, type FileKind } from "@/lib/extract/file-types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadedQuote {
  id: string;
  label: string;
  kind: FileKind | "pasted";
  size: number | null;
}

type Item = UploadedQuote & { status: "saved" | "uploading" | "error"; error?: string; key: string };

const ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  word: FileText,
  text: Type,
  pasted: Type,
  excel: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: ImageIcon,
  unsupported: FileText,
};

const AUTO_READ: Record<string, string> = {
  pdf: "Read automatically",
  excel: "Read automatically",
  csv: "Read automatically",
  word: "Read automatically",
  text: "Read automatically",
  pasted: "Read automatically",
  image: "You'll type the numbers",
  unsupported: "You'll type the numbers",
};

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
const sizeLabel = (n: number | null) => (n == null ? "" : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function QuoteUploader({
  comparisonId,
  userId,
  initial,
}: {
  comparisonId: string;
  userId: string;
  initial: UploadedQuote[];
}) {
  const [items, setItems] = useState<Item[]>(initial.map((q) => ({ ...q, status: "saved", key: q.id })));
  const [message, setMessage] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [reading, startReading] = useTransition();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const saved = items.filter((i) => i.status === "saved");
  const room = MAX_QUOTES - items.filter((i) => i.status !== "error").length;
  const patch = (key: string, next: Partial<Item>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...next } : i)));

  async function addFiles(files: FileList | File[]) {
    setMessage(null);
    const list = Array.from(files);
    if (list.length > room) setMessage(`You can add ${room} more ${room === 1 ? "quote" : "quotes"} (6 at most). The rest were skipped.`);
    const supabase = createClient();
    setBusy(true);
    // One at a time, so each quote keeps the order it was added in.
    for (const file of list.slice(0, Math.max(0, room))) {
      await (async () => {
        const key = crypto.randomUUID();
        const kind = kindOf(file.name, file.type);
        const base: Item = { id: "", key, label: file.name, kind, size: file.size, status: "uploading" };
        setItems((l) => [...l, base]);
        if (!ACCEPTED_EXTENSIONS.includes(`.${extensionOf(file.name)}` as (typeof ACCEPTED_EXTENSIONS)[number])) {
          return patch(key, { status: "error", error: "This file type isn't supported. Use PDF, Excel, CSV, Word, a photo, or paste the text." });
        }
        if (file.size > MAX_FILE_BYTES) return patch(key, { status: "error", error: "This file is over 20 MB." });
        const path = `${userId}/${comparisonId}/${key}-${safeName(file.name)}`;
        const { error } = await supabase.storage.from("quotes").upload(path, file, { contentType: mimeFor(file.name, file.type), upsert: false });
        if (error) return patch(key, { status: "error", error: "Upload failed. Check your connection and try again." });
        const res = await addFileQuote({ comparisonId, path, name: file.name, size: file.size, mime: mimeFor(file.name, file.type) });
        if (!res.ok) return patch(key, { status: "error", error: res.message });
        patch(key, { status: "saved", id: res.id! });
      })();
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function addPaste() {
    setPasteError(null);
    if (room <= 0) return setPasteError("You already have 6 quotes.");
    setBusy(true);
    const res = await addTextQuote({ comparisonId, text: paste });
    setBusy(false);
    if (!res.ok) return setPasteError(res.message);
    const first = paste.trim().split("\n")[0].slice(0, 50);
    setItems((l) => [...l, { id: res.id!, key: res.id!, label: `Pasted: ${first}${paste.trim().length > 50 ? "…" : ""}`, kind: "pasted", size: null, status: "saved" }]);
    setPaste("");
  }

  async function remove(item: Item) {
    if (item.status === "error" || !item.id) return setItems((l) => l.filter((i) => i.key !== item.key));
    patch(item.key, { status: "uploading" });
    const res = await removeQuote(item.id);
    if (!res.ok) return patch(item.key, { status: "saved" }), setMessage(res.message);
    setItems((l) => l.filter((i) => i.key !== item.key));
  }

  function read() {
    setMessage(null);
    if (saved.length < MIN_QUOTES) return setMessage(`Add at least ${MIN_QUOTES} quotes to compare.`);
    startReading(async () => {
      const res = await readQuotes(comparisonId);
      if (res && !res.ok) setMessage(res.message);
    });
  }

  return (
    <div className="max-w-3xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          over ? "border-brand bg-brand-2" : "border-line-2 bg-paper-2",
        )}
      >
        <Upload className="mx-auto size-8 text-brand" aria-hidden />
        <p className="mt-3 text-[17px] font-semibold text-ink">
          Drop quote files here, or{" "}
          <label htmlFor="quote-files" className="cursor-pointer text-brand underline underline-offset-2">
            choose files
          </label>
        </p>
        <input
          ref={inputRef}
          id="quote-files"
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="sr-only"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          disabled={room <= 0 || busy}
        />
        <p className="mt-2 text-sm text-ink-3">PDF, Excel (.xlsx), CSV, Word (.docx), photos or screenshots. Up to 20 MB each.</p>
      </div>

      {items.length > 0 && (
        <ul className="mt-5 divide-y divide-line rounded-xl border border-line-2" aria-label="Quotes added">
          {items.map((item) => {
            const Icon = ICON[item.kind] ?? FileText;
            return (
              <li key={item.key} className="flex items-center gap-4 px-4 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-paper-2 text-ink-2">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.label}</p>
                  {item.status === "error" ? (
                    <p className="flex items-center gap-1.5 text-[13px] text-danger">
                      <AlertTriangle className="size-3.5" aria-hidden /> {item.error}
                    </p>
                  ) : (
                    <p className="text-[13px] text-ink-3">
                      {[sizeLabel(item.size), AUTO_READ[item.kind]].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[13px]" aria-live="polite">
                  {item.status === "uploading" && <Loader2 className="size-4 animate-spin text-ink-3" aria-label="Working" />}
                  {item.status === "saved" && <Check className="size-4 text-brand" aria-label="Saved" />}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={item.status === "uploading" || reading}
                  className="rounded-md p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink disabled:opacity-40"
                  aria-label={`Remove ${item.label}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-5 rounded-xl border border-line-2 px-4 py-3 open:pb-4">
        <summary className="cursor-pointer font-semibold text-ink">Paste a quote as text (WhatsApp, email)</summary>
        <label htmlFor="paste" className="mt-3 block text-sm font-medium text-ink-2">
          Quote text
        </label>
        <textarea
          id="paste"
          rows={5}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"e.g. 12x10x8 3 ply brown — 19.50 per box all inclusive (GST 18% + delivery)"}
          className="mt-1.5 w-full rounded-md border border-input bg-white px-3 py-2 text-[15px] text-ink placeholder:text-ink-3"
          aria-invalid={pasteError ? true : undefined}
          aria-describedby={pasteError ? "paste-error" : undefined}
        />
        {pasteError && (
          <p id="paste-error" className="mt-1.5 text-[13px] font-medium text-danger">
            {pasteError}
          </p>
        )}
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addPaste} disabled={busy || !paste.trim()}>
          Add as a quote
        </Button>
      </details>

      {message && (
        <p role="alert" className="mt-5 rounded-md bg-amber-2 px-4 py-3 text-[15px] text-amber">
          {message}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={read} disabled={reading || busy || saved.length < MIN_QUOTES}>
          {reading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Reading quotes
            </>
          ) : (
            "Read quotes and check numbers"
          )}
        </Button>
        <p className="text-sm text-ink-3">
          {saved.length} of {MAX_QUOTES} quotes added{saved.length < MIN_QUOTES ? `; add at least ${MIN_QUOTES}` : ""}.
        </p>
      </div>
    </div>
  );
}
