"use client";

// PostHog initialized in src/instrumentation-client.ts
// Re-export for use in client components that can't use usePostHog() hook
import posthog from "posthog-js";

export { posthog };
