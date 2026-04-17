import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent, EventPayload } from "@/lib/analytics/events";
import { useCallback } from "react";

export function useAnalytics() {
  const posthog = usePostHog();

  const trackEvent = useCallback(
    <T extends AnalyticsEvent>(eventName: T, properties?: EventPayload<T>) => {
      if (!posthog) return;
      posthog.capture(eventName, properties || {});
    },
    [posthog]
  );

  return { trackEvent };
}
