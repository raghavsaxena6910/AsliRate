import posthog from "posthog-js";

/**
 * PostHog settings. The project key (phc_…) is public by design; a personal
 * key (phx_…) must never be used here.
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";
export const analyticsEnabled = POSTHOG_KEY.startsWith("phc_");

/** Product events we care about for the funnel. */
export type AnalyticsEvent =
  | "demo_step_viewed"
  | "demo_quotes_compared"
  | "signup_submitted"
  | "login_succeeded"
  | "profile_saved"
  | "comparison_started"
  | "quotes_read"
  | "results_viewed"
  | "free_limit_reached"
  | "upgrade_clicked"
  | "pro_activated"
  | "share_link_created"
  | "excel_downloaded"
  | "results_printed"
  | "calculator_used";

/** Link this browser's events to the signed-in account (by id only, never email). */
export function identify(userId: string) {
  if (!analyticsEnabled || typeof window === "undefined") return;
  try {
    posthog.identify(userId);
  } catch {
    // ignore
  }
}

/** Fire-and-forget event; never throws, never sends quote contents. */
export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (!analyticsEnabled || typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the product.
  }
}
