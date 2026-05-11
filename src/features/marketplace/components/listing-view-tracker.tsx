"use client";

import { useEffect, useRef } from "react";

import { useCsrfToken } from "@/features/providers/components/csrf-provider";

interface ListingViewTrackerProps {
  listingId: string;
  listingSlug: string;
  brand: string;
  model: string;
  city: string;
  price: number;
  year: number;
  status: string;
  sellerId?: string;
}

export function ListingViewTracker({
  listingId,
  listingSlug,
  brand,
  model,
  city,
  price,
  year,
  status,
  sellerId,
}: ListingViewTrackerProps) {
  const { token: csrfToken, isReady, refresh: refreshCsrfToken } = useCsrfToken();
  const hasTrackedViewRef = useRef(false);
  const hasAttemptedViewRef = useRef(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (hasTrackedViewRef.current || hasAttemptedViewRef.current) {
      return;
    }

    hasAttemptedViewRef.current = true;

    let cancelled = false;

    const recordView = async () => {
      // Analytics endpoint (primary tracking)
      const trackAnalytics = async () => {
        try {
          const sessionId =
            sessionStorage.getItem("otoburada_session_id") || `session_${Date.now()}`;
          await fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              session_id: sessionId,
              event_name: "listing_view",
              event_properties: {
                listing_slug: listingSlug,
                brand,
                model,
                city,
                price,
                year,
                status,
                seller_id: sellerId,
              },
              page_url: window.location.href,
              listing_id: listingId,
              seller_id: sellerId,
            }),
          });
        } catch (error) {
          // Fail gracefully
          console.debug("Analytics track failed:", error);
        }
      };

      // Backward compatibility: also hit legacy /api/listings/view if needed
      const recordLegacyView = async (token: string) => {
        try {
          await fetch("/api/listings/view", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": token,
            },
            credentials: "same-origin",
            body: JSON.stringify({ listingId }),
          });
        } catch {
          // Silent fail
        }
      };

      let activeToken = csrfToken;

      if (!activeToken) {
        activeToken = await refreshCsrfToken();
      }

      if (cancelled || !activeToken) {
        return;
      }

      try {
        // Fire analytics track (no auth required)
        await trackAnalytics();

        // Fire legacy view record (requires CSRF)
        await recordLegacyView(activeToken);

        hasTrackedViewRef.current = true;
      } catch {
        // Network errors ignored
      }
    };

    void recordView();

    return () => {
      cancelled = true;
    };
  }, [
    listingId,
    listingSlug,
    brand,
    model,
    city,
    price,
    year,
    status,
    sellerId,
    csrfToken,
    refreshCsrfToken,
    isReady,
  ]);

  return null;
}
