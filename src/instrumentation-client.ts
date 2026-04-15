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

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});
