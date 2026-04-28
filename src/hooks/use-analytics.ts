import { useCallback } from "react";

import {
  AnalyticsEvent,
  type ClientAnalyticsEvent,
  type EventPayload,
} from "@/lib/analytics/events";

/**
 * Type-safe analytics hook (Stub).
 * PostHog has been removed. This hook now only logs to console in development.
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
