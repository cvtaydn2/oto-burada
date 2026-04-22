import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

import {
  AnalyticsEvent,
  type ClientAnalyticsEvent,
  type EventPayload,
} from "@/lib/analytics/events";

/**
 * Tip-güvenli analitik hook'u.
 *
 * UI bileşenlerinde PostHog event'leri göndermek için tek giriş noktası.
 * Sadece `ClientAnalyticsEvent` enum değerlerini kabul eder — server event'leri
 * yanlışlıkla client'tan gönderilmeye çalışıldığında TypeScript hata verir.
 *
 * @example
 * const { trackEvent } = useAnalytics();
 * trackEvent(AnalyticsEvent.LISTING_VIEWED, {
 *   listingId: "abc",
 *   brand: "BMW",
 *   model: "320i",
 *   year: 2021,
 *   price: 1_500_000,
 * });
 */
export function useAnalytics() {
  const posthog = usePostHog();

  /**
   * Tip-güvenli event gönderimi.
   * Event Dictionary'de tanımlı client event'lerini ve ilgili property'leri zorunlu kılar.
   */
  const trackEvent = useCallback(
    <T extends ClientAnalyticsEvent>(eventName: T, properties?: EventPayload<T>) => {
      if (!posthog) return;
      posthog.capture(eventName, properties ?? {});
    },
    [posthog]
  );

  return { trackEvent };
}

export { AnalyticsEvent };
