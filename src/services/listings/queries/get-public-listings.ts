import { withNextCache } from "@/lib/caching/cache";
import { maskPhoneNumber } from "@/lib/listings/utils";
import { logger } from "@/lib/logging/logger";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { getListingBySlug, getPublicListings } from "@/services/listings/catalog";
import { createExpertDocumentSignedUrl } from "@/services/listings/listing-documents";
import {
  getSimilarDatabaseListings,
  marketplaceListingSelect,
  PaginatedListingsResult,
} from "@/services/listings/listing-submission-query";
import { mapListingRow } from "@/services/listings/mappers/listing-row.mapper";
import { getPublicSellerProfile } from "@/services/profile/profile-records";
import type { Listing, ListingFilters, Profile } from "@/types";

const SUPPORTED_MARKETPLACE_FILTER_KEYS = new Set<keyof ListingFilters>([
  "brand",
  "model",
  "carTrim",
  "city",
  "district",
  "fuelType",
  "transmission",
  "minPrice",
  "maxPrice",
  "minYear",
  "maxYear",
  "maxMileage",
  "hasExpertReport",
  "maxTramer",
  "query",
  "sort",
  "page",
  "limit",
  "citySlug",
  "sellerId",
  "cursor",
  "isExchange",
]);

// ── LOGIC FIX: Issue LOGIC-02 - Communicate Dropped Filter Keys ─────────────
// Return dropped keys in the response so frontend can inform users about
// unsupported filters instead of silently ignoring them.
function sanitizeMarketplaceFilters(filters: ListingFilters): {
  sanitized: ListingFilters;
  droppedKeys: string[];
} {
  const sanitized = {} as ListingFilters;
  const droppedKeys: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (SUPPORTED_MARKETPLACE_FILTER_KEYS.has(key as keyof ListingFilters)) {
      (sanitized as Record<string, unknown>)[key] = value;
    } else {
      droppedKeys.push(key);
    }
  }

  if (droppedKeys.length > 0) {
    logger.listings.warn("Dropping unsupported marketplace filter keys", { droppedKeys });
    captureServerEvent("marketplace_filters_sanitized", { droppedKeys });
  }

  return { sanitized, droppedKeys };
}

export async function getFilteredMarketplaceListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const { sanitized, droppedKeys } = sanitizeMarketplaceFilters(filters);
  const result = await getPublicListings(sanitized);

  // Add dropped keys to response metadata if any were dropped
  if (droppedKeys.length > 0) {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        droppedFilters: droppedKeys,
        warning: "Bazı filtreler desteklenmiyor ve uygulanmadı.",
      },
    };
  }

  return result;
}

export async function getMarketplaceListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];

  const publicClient = createSupabasePublicServerClient();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await (publicClient
    .from("listings")
    .select(marketplaceListingSelect)
    .in("id", ids)
    .eq("status", "approved") as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) {
    logger.db.error("Marketplace listings by IDs retrieval failed", { error, ids });
    return [];
  }

  return (data ?? []).map(mapListingRow);
}

export async function getMarketplaceListingBySlug(slug: string): Promise<Listing | null> {
  // ── PERFORMANCE FIX: Issue PERF-07 - Increase Cache Duration ─────────────
  // Increased from 60s to 300s (5 minutes) for better performance.
  // Use revalidateTag for immediate updates when listings change.
  // Cache key includes 'marketplace-listing' prefix for easy invalidation.
  const storedListing = await withNextCache<Listing | null>(
    [`marketplace-listing:${slug}`],
    () => getListingBySlug(slug),
    300 // 5 minutes cache
  );

  if (!storedListing) return null;

  const maskedListing = {
    ...storedListing,
    whatsappPhone: maskPhoneNumber(storedListing.whatsappPhone),
  };

  if (!storedListing.expertInspection?.documentPath) return maskedListing;

  const signedUrl = await createExpertDocumentSignedUrl(
    storedListing.expertInspection.documentPath
  );

  return {
    ...maskedListing,
    expertInspection: {
      ...storedListing.expertInspection,
      documentUrl: signedUrl ?? storedListing.expertInspection.documentUrl,
    },
  };
}

export async function getListingById(id: string): Promise<Listing | null> {
  const publicClient = createSupabasePublicServerClient();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await (publicClient
    .from("listings")
    .select(marketplaceListingSelect)
    .eq("id", id)
    .maybeSingle() as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) {
    logger.db.error("Public listing by ID retrieval failed", { error, id });
    return null;
  }

  if (!data) {
    return null;
  }

  // Ensure single result (maybeSingle should guarantee this, but defensive check)
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    if (data.length > 1) {
      logger.db.warn("Multiple listings returned for single ID", { id, count: data.length });
    }
    return mapListingRow(data[0]);
  }

  return mapListingRow(data);
}

export async function getMarketplaceSeller(sellerId: string): Promise<Profile | null> {
  return withNextCache(
    [`marketplace-seller:${sellerId}`],
    () => getPublicSellerProfile(sellerId),
    300
  );
}

export async function getPublicMarketplaceListings(
  filters: ListingFilters = { page: 1, limit: 12, sort: "newest" }
) {
  const keyParts = [
    "public-listings",
    `p:${filters.page ?? 1}`,
    `l:${filters.limit ?? 12}`,
    `s:${filters.sort ?? "newest"}`,
    `b:${filters.brand ?? "all"}`,
    `m:${filters.model ?? "all"}`,
    `c:${filters.city ?? "all"}`,
    `q:${filters.query ?? ""}`,
    `f:${filters.fuelType ?? ""}`,
    `t:${filters.transmission ?? ""}`,
    `minP:${filters.minPrice ?? ""}`,
    `maxP:${filters.maxPrice ?? ""}`,
    `minY:${filters.minYear ?? ""}`,
    `maxY:${filters.maxYear ?? ""}`,
  ];
  return withNextCache(keyParts, () => getFilteredMarketplaceListings(filters), 60);
}

export async function getRecentMarketplaceListings(limit = 100) {
  const result = await getPublicListings({ limit, page: 1, sort: "newest" });
  return result.listings;
}

export async function getSimilarMarketplaceListings(
  slug: string,
  brand: string,
  city: string
): Promise<Listing[]> {
  return withNextCache(
    [`similar-marketplace-listings:${slug}:${brand}:${city}`],
    () => getSimilarDatabaseListings({ slug, brand, city, limit: 12 }),
    120
  );
}
