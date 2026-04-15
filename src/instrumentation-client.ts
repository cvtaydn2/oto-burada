import posthog from "posthog-js";

// Next.js 15.3+ instrumentation-client pattern
// This file runs before the app initializes — ideal for PostHog setup
const token =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    // defaults: '2026-01-30' enables:
    //   - exception autocapture (unhandled errors + promise rejections)
    //   - session recording
    //   - web vitals
    //   - dead clicks
    //   - rage clicks
    defaults: "2026-01-30",
    // Only override what's strictly necessary
    capture_pageview: false, // handled manually via PostHogProvider
    person_profiles: "identified_only",
    session_recording: {
      maskAllInputs: true, // mask passwords, phone numbers, TC no etc.
      maskTextSelector: "[data-sensitive]", // add data-sensitive to any sensitive element
    },
  });
}
