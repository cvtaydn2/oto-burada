"use client";

import { useEffect } from "react";

import { captureClientEvent, captureClientException } from "@/lib/monitoring/posthog-client";

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
  useEffect(() => {
    const recordView = async () => {
      try {
        const csrfToken =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("csrf_token="))
                ?.split("=")[1]
            : undefined;

        const response = await fetch("/api/listings/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          },
          body: JSON.stringify({ listingId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to record listing view: ${response.status}`);
        }
      } catch (error) {
        captureClientException(error, "listing_view_record_failed", {
          listingId,
          listingSlug,
        });
      }
    };

    void recordView();

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
  }, [listingId, listingSlug, brand, model, city, price, year, status]);

  return null;
}
