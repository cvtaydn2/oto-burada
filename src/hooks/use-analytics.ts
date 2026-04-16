"use client";

import { useCallback } from "react";
import { usePostHog } from "posthog-js/react";

interface AnalyticsEvent {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

export function useAnalytics() {
  const posthog = usePostHog();

  const trackPageView = useCallback((page: string) => {
    posthog?.capture("$pageview", { $current_url: page });
  }, [posthog]);

  const trackEvent = useCallback((eventName: string, params?: AnalyticsEvent) => {
    posthog?.capture(eventName, params);
  }, [posthog]);

  const trackListingView = useCallback((listingId: string, brand: string, model: string) => {
    posthog?.capture("listing_view", {
      category: "engagement",
      listingId,
      label: `${brand} ${model}`,
    });
  }, [posthog]);

  const trackSearch = useCallback((query: string, resultCount: number) => {
    trackEvent("search", {
      category: "engagement",
      label: query,
      value: resultCount,
    });
  }, [trackEvent]);

  const trackFavorite = useCallback((action: "add" | "remove", listingId: string) => {
    trackEvent(action === "add" ? "favorite_add" : "favorite_remove", {
      category: "engagement",
      listingId,
    });
  }, [trackEvent]);

  const trackContact = useCallback((method: "whatsapp" | "phone" | "message") => {
    trackEvent("contact_click", {
      category: "conversion",
      label: method,
    });
  }, [trackEvent]);

  const trackConversion = useCallback((type: "listing_create" | "registration" | "login") => {
    trackEvent("conversion", {
      category: "conversion",
      label: type,
    });
  }, [trackEvent]);

  return {
    trackPageView,
    trackEvent,
    trackListingView,
    trackSearch,
    trackFavorite,
    trackContact,
    trackConversion,
  };
}
