/**
 * PostHog initialization — Next.js 15.3+ instrumentation-client pattern.
 * Runs before the app initializes on the client side.
 *
 * defaults: '2026-01-30' automatically enables:
 *   - Exception autocapture (unhandled JS errors + promise rejections)
 *   - Session recording
 *   - Web vitals
 *   - Dead clicks / rage clicks
 *   - Pageview capture
 *
 * Docs: https://posthog.com/docs/error-tracking/installation/nextjs
 */
import posthog from "posthog-js";

const posthogProjectToken =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogProjectToken) {
  posthog.init(posthogProjectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_pageview: false,
    opt_out_capturing_by_default: true,
    sanitize_properties: (properties) => {
      // Basic PII masking for client-side events
      for (const [key, value] of Object.entries(properties)) {
        if (typeof value === "string") {
          // Mask emails
          if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value)) {
            properties[key] = "[EMAIL_REDACTED]";
          }
          // Request specific masks for obvious keys
          if (["email", "phone", "tc", "tc_no", "identity"].includes(key.toLowerCase())) {
            properties[key] = "[PII_REDACTED]";
          }
        }
      }
      return properties;
    },
    loaded: (client) => {
      if (typeof window === "undefined") {
        return;
      }

      if (window.localStorage.getItem("cookie-consent") === "true") {
        client.opt_in_capturing();
      }
    },
  });
}
