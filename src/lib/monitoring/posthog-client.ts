"use client";

// PostHog initialized in src/instrumentation-client.ts
// Re-export for use in client components that can't use usePostHog() hook
import posthog from "posthog-js";

export { posthog };

export function captureClientEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    posthog.capture(eventName, properties);
  }
}
