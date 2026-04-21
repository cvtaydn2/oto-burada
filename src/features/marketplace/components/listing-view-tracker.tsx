"use client";

import { useEffect } from "react";
import { captureClientEvent } from "@/lib/monitoring/posthog-client";

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
    // Record view in DB via API
    fetch("/api/listings/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    }).catch(() => {});

    // Capture PostHog event
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
