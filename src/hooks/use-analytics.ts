"use client";

/**
 * useAnalytics — Client-side analytics tracking hook
 *
 * Provides simple tracking functions for key user interactions
 * Queues events to be sent via server actions or fetch
 */

import { useCallback, useRef } from "react";

import { generateId } from "@/lib/utils";

type AnalyticsEventType =
  | "page_view"
  | "search_suggestion_used"
  | "filter_applied"
  | "listing_view"
  | "contact_cta_clicked"
  | "contact_success"
  | "favori_added"
  | "favori_removed"
  | "image_gallery_interaction"
  | "listing_lightbox_opened"
  | "listing_360_opened"
  | "mobile_sticky_action_expanded";

interface UseAnalyticsReturn {
  track: (event: AnalyticsEventType, properties?: Record<string, unknown>) => void;
  trackPageView: (url: string) => void;
  trackListingView: (listingId: string) => void;
  trackContactClick: (listingId: string, ctaType: "whatsapp" | "phone" | "message") => void;
  trackFavori: (listingId: string, action: "add" | "remove") => void;
  trackSearch: (query: string, usedSuggestion: boolean) => void;
  trackFilter: (filterType: string, value: string) => void;
}

/**
 * Generate or retrieve a persistent session ID
 *
 * Must be safe in SSR/pre-render environments where `window` and
 * `sessionStorage` are unavailable.
 */
function getSessionId(): string {
  if (typeof window === "undefined") {
    return `session_${generateId()}`;
  }

  try {
    let sessionId = window.sessionStorage.getItem("otoburada_session_id");
    if (!sessionId) {
      sessionId = `session_${generateId()}`;
      window.sessionStorage.setItem("otoburada_session_id", sessionId);
    }
    return sessionId;
  } catch {
    return `session_${generateId()}`;
  }
}

/**
 * UseAnalytics hook
 */
export function useAnalytics(): UseAnalyticsReturn {
  const sessionIdRef = useRef<string>("");

  /**
   * Core track function — sends event to server
   */
  const track = useCallback(
    async (event: AnalyticsEventType, properties: Record<string, unknown> = {}) => {
      if (!sessionIdRef.current) {
        sessionIdRef.current = getSessionId();
      }

      const eventData = {
        session_id: sessionIdRef.current,
        event_name: event,
        event_properties: properties,
        page_url: window.location.href,
        referrer_url: document.referrer || undefined,
        user_agent: navigator.userAgent || undefined,
        ...properties,
      };

      // Use server action or fetch to /api/analytics/track
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      } catch (error) {
        // Fail gracefully: do not break user experience
        console.debug("Analytics tracking failed:", error);
      }
    },
    []
  );

  /**
   * Track page view (automatic or manual)
   */
  const trackPageView = useCallback(
    (url: string) => {
      track("page_view", { url });
    },
    [track]
  );

  /**
   * Track listing detail view
   */
  const trackListingView = useCallback(
    (listingId: string) => {
      track("listing_view", { listing_id: listingId });
    },
    [track]
  );

  /**
   * Track contact CTA click
   */
  const trackContactClick = useCallback(
    (listingId: string, ctaType: "whatsapp" | "phone" | "message") => {
      track("contact_cta_clicked", { listing_id: listingId, cta_type: ctaType });
    },
    [track]
  );

  /**
   * Track favori add/remove
   */
  const trackFavori = useCallback(
    (listingId: string, action: "add" | "remove") => {
      track(action === "add" ? "favori_added" : "favori_removed", { listing_id: listingId });
    },
    [track]
  );

  /**
   * Track search interaction
   */
  const trackSearch = useCallback(
    (query: string, usedSuggestion: boolean) => {
      track("search_suggestion_used", { query, used_suggestion: usedSuggestion });
    },
    [track]
  );

  /**
   * Track filter application
   */
  const trackFilter = useCallback(
    (filterType: string, value: string) => {
      track("filter_applied", { filter_type: filterType, filter_value: value });
    },
    [track]
  );

  return {
    track,
    trackPageView,
    trackListingView,
    trackContactClick,
    trackFavori,
    trackSearch,
    trackFilter,
  };
}
