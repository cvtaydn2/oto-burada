"use client";

// PostHog is initialized in src/instrumentation-client.ts (Next.js 15.3+ pattern)
// This file just re-exports the posthog instance for use in components.
import posthog from "posthog-js";

export { posthog };
