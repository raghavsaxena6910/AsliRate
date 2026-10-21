"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { compareQuotes } from "@/lib/engine/compare";
import { formToQuoteInput, type FormErrors } from "@/lib/review/quote-form";
import { buildRationale } from "@/lib/rationale/template";
import { fileToText } from "@/lib/extract/files";
import { readQuote, toQuoteForm, blankQuoteForm, type ReadResult } from "@/lib/extract/read-quote";
import { todayInIndia } from "@/lib/format";
import {
  ENGINE_VERSION,
  MAX_FILE_BYTES,
  MAX_QUOTES,
  MIN_QUOTES,
  newComparisonSchema,
  reviewSubmissionSchema,
  type ExtractedRecord,
} from "./schemas";
import { fieldErrors, type FieldErrors } from "@/lib/auth/schemas";
import { getPlan } from "@/lib/billing/server";
import { LIMIT_MESSAGE } from "@/lib/billing/rules";

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

const uuid = z.uuid();

/* ---------------- create ---------------- */

export type NewComparisonState = { errors?: FieldErrors; message?: string; values?: Record<string, string> };

export async function createComparison(_prev: NewComparisonState, formData: FormData): Promise<NewComparisonState> {
  const values = Object.fromEntries(
    ["item_description", "specification", "qty_needed", "unit", "required_by", "deliver_to"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = newComparisonSchema.safeParse({ ...values, buyer_gst_registered: formData.get("buyer_gst_registered") === "on" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { supabase, userId } = await session();
  const plan = await getPlan(userId);
  if (!plan.pro && plan.used >= plan.limit) return { message: LIMIT_MESSAGE, values };
  const { data, error } = await supabase
    .from("comparisons")
    .insert({ ...parsed.data, specification: parsed.data.specification || null, deliver_to: parsed.data.deliver_to || null, user_id: userId })
    .select("id")
    .single();
  if (error || !data) return { message: "We couldn't create the comparison. Try again.", values };
  redirect(`/comparisons/${data.id}/quotes`);
}

/* ---------------- add / remove quotes ---------------- */

export type ActionResult = { ok: true; id?: string } | { ok: false; message: string };

const fileQuoteSchema = z.object({
  comparisonId: uuid,
  path: z.string().min(1).max(500),
  name: z.string().trim().min(1).max(200),
  size: z.number().int().nonnegative().max(MAX_FILE_BYTES),
  mime: z.string().max(120).nullable(),
});

/** Called after the browser has uploaded a file to private storage. */
export async function addFileQuote(input: z.input<typeof fileQuoteSchema>): Promise<ActionResult> {
  const parsed = fileQuoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That upload didn't look right. Try again." };
  const { comparisonId, path, name, size, mime } = parsed.data;
  const { supabase, userId } = await session();
  if (!path.startsWith(`${userId}/${comparisonId}/`)) return { ok: false, message: "That upload didn't look right. Try again." };

  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).eq("comparison_id", comparisonId);
  const { data, error } = await supabase
    .from("quotes")
    .insert({ comparison_id: comparisonId, user_id: userId, file_path: path, file_name: name, file_size: size, mime_type: mime, position: count ?? 0 })
    .select("id")
    .single();
  if (error || !data) {
    await supabase.storage.from("quotes").remove([path]);
    return { ok: false, message: error?.message.includes("at most 6") ? `A comparison can have at most ${MAX_QUOTES} quotes.` : "We couldn't save that file. Try again." };
  }
  await supabase.from("comparisons").update({ status: "draft" }).eq("id", comparisonId);
  revalidatePath(`/comparisons/${comparisonId}`, "layout");
  return { ok: true, id: data.id };
}

const textQuoteSchema = z.object({ comparisonId: uuid, text: z.string().trim().min(10, "Paste a bit more of the quote.").max(20000) });

export async function addTextQuote(input: z.input<typeof textQuoteSchema>): Promise<ActionResult> {
  const parsed = textQuoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Paste the quote text." };
  const { supabase, userId } = await session();
  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).eq("comparison_id", parsed.data.comparisonId);
  const { data, error } = await supabase
    .from("quotes")
    .insert({ comparison_id: parsed.data.comparisonId, user_id: userId, pasted_text: parsed.data.text, position: count ?? 0 })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, message: error?.message.includes("at most 6") ? `A comparison can have at most ${MAX_QUOTES} quotes.` : "We couldn't add that quote. Try again." };
  }
  await supabase.from("comparisons").update({ status: "draft" }).eq("id", parsed.data.comparisonId);
  revalidatePath(`/comparisons/${parsed.data.comparisonId}`, "layout");
  return { ok: true, id: data.id };
}

export async function removeQuote(quoteId: string): Promise<ActionResult> {
  if (!uuid.safeParse(quoteId).success) return { ok: false, message: "Not found." };
  const { supabase } = await session();
  const { data: q } = await supabase.from("quotes").select("id, comparison_id, file_path").eq("id", quoteId).maybeSingle();
  if (!q) return { ok: false, message: "That quote was already removed." };
  const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
  if (error) return { ok: false, message: "We couldn't remove that quote. Try again." };
  if (q.file_path) await supabase.storage.from("quotes").remove([q.file_path]);
  await supabase.from("comparisons").update({ status: "draft" }).eq("id", q.comparison_id);
  revalidatePath(`/comparisons/${q.comparison_id}`, "layout");
  return { ok: true };
}

/* ---------------- read ---------------- */

export async function readQuotes(comparisonId: string): Promise<ActionResult> {
  if (!uuid.safeParse(comparisonId).success) return { ok: false, message: "Not found." };
  const { supabase } = await session();
  const [{ data: comparison }, { data: profile }] = await Promise.all([
    supabase.from("comparisons").select("id, item_description, specification, unit").eq("id", comparisonId).maybeSingle(),
    supabase.from("profiles").select("gstin").maybeSingle(),
  ]);
  if (!comparison) return { ok: false, message: "Comparison not found." };

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, file_path, file_name, mime_type, pasted_text, extraction_status")
    .eq("comparison_id", comparisonId);
  if (!quotes || quotes.length < MIN_QUOTES) return { ok: false, message: `Add at least ${MIN_QUOTES} quotes to compare.` };

  const item = [comparison.item_description, comparison.specification].filter(Boolean).join(" ");
  for (const q of quotes.filter((x) => x.extraction_status !== "read")) {
    let result: ReadResult | null = null;
    let method = "manual";
    let note = "";
    if (q.pasted_text) {
      result = readQuote({ lines: q.pasted_text.split(/\r?\n/) }, { item, unit: comparison.unit, buyerGstin: profile?.gstin, method: "text" });
      method = "text";
    } else if (q.file_path && q.file_name) {
      const { data: blob, error } = await supabase.storage.from("quotes").download(q.file_path);
      if (error || !blob) {
        note = "We couldn't open this file. Type the numbers from the original below.";
      } else {
        const text = await fileToText(q.file_name, q.mime_type, await blob.arrayBuffer());
        method = text.method;
        if (text.problem) note = text.problem;
        else result = readQuote(text.input, { item, unit: comparison.unit, buyerGstin: profile?.gstin, method: text.method });
      }
    }
    if (result && !note) {
      note = result.found.length
        ? "Read automatically. Check every value against the original; highlighted ones need a closer look."
        : "We couldn't find the numbers in this quote. Type them from the original below.";
    }
    const form = result ? toQuoteForm(q.id, result) : blankQuoteForm(q.id);
    const extracted: ExtractedRecord = { method, note, found: result?.found ?? [], form };
    await supabase
      .from("quotes")
      .update({
        extraction_status: "read",
        extraction_error: null,
        extracted,
        field_confidence: form.confidence,
        field_sources: form.source,
      })
      .eq("id", q.id);
  }
  await supabase.from("comparisons").update({ status: "review" }).eq("id", comparisonId);
  revalidatePath(`/comparisons/${comparisonId}`, "layout");
  redirect(`/comparisons/${comparisonId}/review`);
}

/* ---------------- confirm and compare ---------------- */

export type ReviewState = { errors?: Record<string, FormErrors>; message?: string; upgrade?: boolean };

export async function confirmAndCompare(comparisonId: string, rawForms: unknown): Promise<ReviewState> {
  if (!uuid.safeParse(comparisonId).success) return { message: "Comparison not found." };
  const parsed = reviewSubmissionSchema.safeParse(rawForms);
  if (!parsed.success) return { message: "Some of the values didn't look right. Refresh the page and try again." };
  const forms = parsed.data;

  const { supabase } = await session();
  const { data: comparison } = await supabase
    .from("comparisons")
    .select("id, item_description, specification, unit, qty_needed, required_by, buyer_gst_registered")
    .eq("id", comparisonId)
    .maybeSingle();
  if (!comparison) return { message: "Comparison not found." };
  const { data: owned } = await supabase.from("quotes").select("id").eq("comparison_id", comparisonId);
  const ownedIds = new Set((owned ?? []).map((q) => q.id));
  if (forms.some((f) => !ownedIds.has(f.id)) || forms.length !== ownedIds.size) {
    return { message: "The quotes changed in another tab. Refresh the page and try again." };
  }
  if (forms.length < MIN_QUOTES) return { message: `Add at least ${MIN_QUOTES} quotes to compare.` };

  // Save what the person typed, even if some of it needs fixing.
  await Promise.all(forms.map((f) => supabase.from("quotes").update({ confirmed: f }).eq("id", f.id)));

  const errors: Record<string, FormErrors> = {};
  const quotes = forms.flatMap((f) => {
    const r = formToQuoteInput(f);
    if (!r.ok) {
      errors[f.id] = r.errors;
      return [];
    }
    return [r.quote];
  });
  if (Object.keys(errors).length) return { errors };

  const engineInput = {
    item_description: [comparison.item_description, comparison.specification].filter(Boolean).join(", ").slice(0, 300),
    unit: comparison.unit,
    qty_needed: Number(comparison.qty_needed),
    buyer_gst_registered: comparison.buyer_gst_registered,
    as_of: todayInIndia(),
    required_by: comparison.required_by,
    quotes,
  };
  let result;
  try {
    result = compareQuotes(engineInput);
  } catch {
    return { message: "One of the quotes has a value we can't calculate with. Check the numbers and try again." };
  }

  const { data: claims } = await supabase.auth.getClaims();
  const { error } = await supabase.from("results").upsert(
    {
      comparison_id: comparisonId,
      user_id: claims!.claims!.sub,
      engine_version: ENGINE_VERSION,
      engine_input: engineInput,
      engine_output: result,
      rationale: buildRationale(result),
    },
    { onConflict: "comparison_id" },
  );
  if (error?.message.includes("free plan limit")) return { message: LIMIT_MESSAGE, upgrade: true };
  if (error) return { message: "We couldn't save the results. Try again." };
  await supabase.from("comparisons").update({ status: "complete" }).eq("id", comparisonId);
  revalidatePath("/dashboard");
  revalidatePath(`/comparisons/${comparisonId}`, "layout");
  redirect(`/comparisons/${comparisonId}`);
}
