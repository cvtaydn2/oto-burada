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
  const hasAttemptedViewRef = useRef(false);

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
    if (hasTrackedViewRef.current || hasAttemptedViewRef.current) {
      return;
    }

    // Bu guard, token refresh sonrası state değişimlerinde effect'in tekrar
    // tetiklenip sonsuz istek döngüsüne girmesini engeller.
    hasAttemptedViewRef.current = true;

    let cancelled = false;

    const recordView = async () => {
      const sendView = async (token: string) => {
        return fetch("/api/listings/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
          },
          credentials: "same-origin",
          body: JSON.stringify({ listingId }),
        });
      };

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
        let response = await sendView(activeToken);

        if (!response.ok && response.status === 403) {
          const refreshedToken = await refreshCsrfToken();

          if (!cancelled && refreshedToken && refreshedToken !== activeToken) {
            response = await sendView(refreshedToken);
          }
        }

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
