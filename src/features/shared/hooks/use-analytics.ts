import { useCallback } from "react";

import { AnalyticsEvent, type ClientAnalyticsEvent, type EventPayload } from "@/lib/events";

/**
 * Type-safe analytics hook.
 * Product analytics are intentionally development-only logs while the project
 * stays on free tiers. Runtime error monitoring is handled by Sentry.
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    <T extends ClientAnalyticsEvent>(eventName: T, properties?: EventPayload<T>) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Analytics] ${eventName}`, properties ?? {});
      }
    },
    []
  );

  return { trackEvent };
}

export { AnalyticsEvent };
