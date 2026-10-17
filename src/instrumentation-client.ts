import posthog from "posthog-js";
import { analyticsEnabled, POSTHOG_KEY, POSTHOG_REGION } from "@/lib/analytics";

// Product analytics. Runs once in the browser before the app becomes interactive.
if (analyticsEnabled) {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest", // proxied through our own domain (see next.config.ts)
      ui_host: `https://${POSTHOG_REGION}.posthog.com`,
      defaults: "2025-05-24", // page views on client-side navigation
      person_profiles: "identified_only",
      disable_session_recording: true, // quotes are confidential business data
      mask_all_text: false,
      autocapture: { dom_event_allowlist: ["click", "submit"] },
    });
  } catch {
    // Never let analytics break the page.
  }
}
