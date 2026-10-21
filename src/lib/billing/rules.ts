/**
 * Plan rules shared by the server and the pages. Kept free of server-only
 * imports so they can be unit-tested. The database enforces the same limit
 * (see the results_free_limit trigger), so the app can't be bypassed.
 */

export const FREE_MONTHLY_LIMIT = 3;
export const PRO_PRICE_RUPEES = 999;

export type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  customer_id: string | null;
};

/** Mirrors public.has_pro(): paid up, or cancelled but still inside the period paid for. */
export function isPro(sub: Pick<SubscriptionRow, "status" | "current_period_end"> | null, now: Date = new Date()): boolean {
  if (!sub) return false;
  if (sub.status === "active" || sub.status === "past_due") return true;
  if ((sub.status === "cancelled" || sub.status === "expired") && sub.current_period_end) {
    return new Date(sub.current_period_end).getTime() > now.getTime();
  }
  return false;
}

/** Midnight on the 1st of the current month in India, as a UTC instant. */
export function monthStartInIndia(now: Date = new Date()): Date {
  const IST_OFFSET_MS = 330 * 60 * 1000;
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET_MS);
}

/** "1 November" — when the free allowance resets. */
export function nextResetLabel(now: Date = new Date()): string {
  const start = monthStartInIndia(now);
  const next = new Date(start.getTime() + 40 * 24 * 3600 * 1000); // safely inside next month
  return monthStartInIndia(next).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
}

export const LIMIT_MESSAGE = `You've used your ${FREE_MONTHLY_LIMIT} free comparisons this month. Upgrade to Pro for unlimited comparisons.`;
