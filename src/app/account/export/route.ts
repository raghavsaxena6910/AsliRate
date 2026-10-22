import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Download everything AsliRate holds about the signed-in user as one JSON file.
 * Reads with the user's own session, so row-level security limits it to their data.
 * Uploaded quote files themselves stay in storage; their names are listed.
 */
export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const supabase = await createClient();

  const [profile, comparisons, quotes, results, subscription, runs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("comparisons").select("*").order("created_at"),
    supabase.from("quotes").select("id, comparison_id, position, file_name, file_size, mime_type, pasted_text, extracted, confirmed, created_at").order("created_at"),
    supabase.from("results").select("comparison_id, engine_version, engine_input, engine_output, rationale, created_at, updated_at"),
    supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end, created_at").maybeSingle(),
    supabase.from("comparison_runs").select("comparison_id, created_at").order("created_at"),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data,
    comparisons: comparisons.data ?? [],
    quotes: quotes.data ?? [],
    results: results.data ?? [],
    subscription: subscription.data,
    comparison_runs: runs.data ?? [],
    notes:
      "Amounts ending in _paise are in paise (100 paise = ₹1). Uploaded quote files are listed by name; download them from each comparison. Payment details are held by Dodo Payments, not AsliRate.",
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="aslirate-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
