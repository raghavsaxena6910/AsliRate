import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { QuoteForm } from "@/lib/review/quote-form";
import { blankQuoteForm } from "@/lib/extract/read-quote";
import { kindLabel, kindOf } from "@/lib/extract/files";
import type { ComparisonStatus, ExtractedRecord } from "./schemas";

export interface ComparisonRow {
  id: string;
  item_description: string;
  specification: string | null;
  unit: string;
  qty_needed: number;
  required_by: string | null;
  deliver_to: string | null;
  buyer_gst_registered: boolean;
  status: ComparisonStatus;
  created_at: string;
  share_token: string | null;
}

export interface QuoteRow {
  id: string;
  position: number;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  pasted_text: string | null;
  extraction_status: "pending" | "reading" | "read" | "failed";
  extracted: ExtractedRecord | null;
  confirmed: QuoteForm | null;
}

/** Load one comparison the signed-in user owns, or show 404 (RLS hides everyone else's). */
export async function getComparison(rawId: string): Promise<ComparisonRow> {
  const id = z.uuid().safeParse(rawId);
  if (!id.success) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comparisons")
    .select("id, item_description, specification, unit, qty_needed, required_by, deliver_to, buyer_gst_registered, status, created_at, share_token")
    .eq("id", id.data)
    .maybeSingle();
  if (error) throw new Error(`Could not load comparison: ${error.message}`);
  if (!data) notFound();
  return { ...data, qty_needed: Number(data.qty_needed) } as ComparisonRow;
}

export async function listQuotes(comparisonId: string): Promise<QuoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, position, file_path, file_name, mime_type, file_size, pasted_text, extraction_status, extracted, confirmed")
    .eq("comparison_id", comparisonId)
    .order("position")
    .order("created_at");
  if (error) throw new Error(`Could not load quotes: ${error.message}`);
  return (data ?? []) as QuoteRow[];
}

/** Short-lived private links to the original files, so people can check numbers against them. */
export async function signedUrls(quotes: QuoteRow[]): Promise<Record<string, string>> {
  const paths = quotes.map((q) => q.file_path).filter((p): p is string => Boolean(p));
  if (!paths.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.storage.from("quotes").createSignedUrls(paths, 60 * 60);
  const byPath = new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  return Object.fromEntries(quotes.filter((q) => q.file_path && byPath.has(q.file_path)).map((q) => [q.id, byPath.get(q.file_path!)!]));
}

/** Everything the review screen needs for one quote. */
export interface ReviewItem {
  form: QuoteForm;
  label: string;
  kind: string;
  isImage: boolean;
  note: string;
  found: string[];
  method: string;
  url: string | null;
  pastedText: string | null;
}

export function toReviewItem(q: QuoteRow, url: string | null): ReviewItem {
  const kind = q.file_name ? kindOf(q.file_name, q.mime_type) : "text";
  const form = q.confirmed ?? q.extracted?.form ?? blankQuoteForm(q.id);
  return {
    form: { ...form, id: q.id },
    label: q.file_name ?? "Pasted text",
    kind: q.file_name ? kindLabel(kind) : "Text",
    isImage: kind === "image",
    note: q.extracted?.note ?? "",
    found: q.extracted?.found ?? [],
    method: q.extracted?.method ?? "manual",
    url,
    pastedText: q.pasted_text,
  };
}
