"use client";

import { useEffect, useRef } from "react";

import { useCsrfToken } from "@/components/providers/csrf-provider";
import { captureClientEvent, captureClientException } from "@/lib/monitoring/telemetry-client";

interface ListingViewTrackerProps {
  listingId: string;
  listingSlug: string;
  brand: string;
  model: string;
  city: string;
  price: number;
  year: number;
  status: string;
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
}: ListingViewTrackerProps) {
  const { token: csrfToken, refresh: refreshCsrfToken } = useCsrfToken();
  const hasTrackedViewRef = useRef(false);
  const hasCapturedEventRef = useRef(false);

  useEffect(() => {
    if (!hasCapturedEventRef.current) {
      captureClientEvent("listing_viewed", {
        listingId,
        listingSlug,
        brand,
        model,
        city,
        price,
        year,
        status,
      });
      hasCapturedEventRef.current = true;
    }
  }, [listingId, listingSlug, brand, model, city, price, year, status]);

  useEffect(() => {
    if (hasTrackedViewRef.current) {
      return;
    }

    let cancelled = false;

    const recordView = async () => {
      let activeToken = csrfToken;

      if (!activeToken) {
        activeToken = await refreshCsrfToken();
      }

      if (cancelled || !activeToken) {
        captureClientException(
          new Error("Missing CSRF token for listing view"),
          "listing_view_csrf_unavailable",
          {
            listingId,
            listingSlug,
          }
        );
        return;
      }

      try {
        const response = await fetch("/api/listings/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": activeToken,
          },
          credentials: "same-origin",
          body: JSON.stringify({ listingId }),
        });

        if (response.ok) {
          hasTrackedViewRef.current = true;
          return;
        }

        if (response.status === 403) {
          captureClientException(
            new Error(`Listing view rejected with status ${response.status}`),
            "listing_view_csrf_rejected",
            {
              listingId,
              listingSlug,
            }
          );
        }
      } catch (error) {
        captureClientException(error, "listing_view_record_failed", {
          listingId,
          listingSlug,
        });
      }
    };

    void recordView();

    return () => {
      cancelled = true;
    };
  }, [listingId, listingSlug, csrfToken, refreshCsrfToken]);

  return null;
}
