"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getPlan } from "@/lib/billing/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteState = { message?: string };

/**
 * Permanently delete the signed-in user's account: uploaded files, then the
 * login itself, which cascades to profile, comparisons, quotes and results.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    return { message: "Type DELETE in the box to confirm." };
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = await getPlan(user.id);
  if (plan.pro && (plan.status === "active" || plan.status === "past_due") && !plan.cancelAtPeriodEnd) {
    return { message: "Cancel your Pro subscription first (Plan → Manage billing), so you aren't charged again. Then delete your account." };
  }

  const admin = adminClient();
  try {
    // Files live at {userId}/{comparisonId}/{file}.
    const { data: folders } = await admin.storage.from("quotes").list(user.id, { limit: 1000 });
    const paths: string[] = [];
    for (const f of folders ?? []) {
      const { data: files } = await admin.storage.from("quotes").list(`${user.id}/${f.name}`, { limit: 1000 });
      for (const file of files ?? []) paths.push(`${user.id}/${f.name}/${file.name}`);
    }
    for (let i = 0; i < paths.length; i += 100) await admin.storage.from("quotes").remove(paths.slice(i, i + 100));

    await admin.from("waitlist").delete().eq("user_id", user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (err) {
    console.error("Account deletion failed", err);
    return { message: "We couldn't delete your account. Please try again, or email raghavjsaxena@gmail.com and we'll do it for you." };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
