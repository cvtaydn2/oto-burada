"use client";

import { useCallback } from "react";

interface AnalyticsEvent {
  category?: string;
  label?: string;
  value?: number;
}

declare global {
  interface Window {
    __vercel_analytics?: {
      fire: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

export function useAnalytics() {
  const trackPageView = useCallback((page: string) => {
    if (typeof window !== "undefined") {
      if (window.__vercel_analytics) {
        window.__vercel_analytics.fire("page_view", { path: page });
      }
    }
  }, []);

  const trackEvent = useCallback((eventName: string, params?: AnalyticsEvent) => {
    if (typeof window !== "undefined" && window.__vercel_analytics) {
      window.__vercel_analytics.fire(eventName, params as Record<string, unknown>);
    }
  }, []);

  const trackListingView = useCallback((listingId: string, brand: string, model: string) => {
    trackEvent("listing_view", {
      category: "engagement",
      label: `${brand} ${model}`,
    });
  }, [trackEvent]);

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
      label: listingId,
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