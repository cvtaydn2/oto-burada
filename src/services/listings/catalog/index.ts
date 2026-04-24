import { maskPhoneNumber } from "@/lib/utils/listing-utils";
import { Listing, ListingFilters } from "@/types";

import {
  getPublicDatabaseListings,
  getPublicFilteredDatabaseListings,
  PaginatedListingsResult,
} from "../listing-submission-query";

/**
 * Public catalog logic for marketplace display.
 * Focused on "read" operations with caching support.
 *
 * SECURITY: Uses RLS-enforced public client for public data
 */

export async function getPublicListings(filters: ListingFilters): Promise<PaginatedListingsResult> {
  // SECURITY: Use public client with RLS enforcement for marketplace data
  const result = await getPublicFilteredDatabaseListings(filters);

  return {
    ...result,
    listings: result.listings.map((l) => ({
      ...l,
      whatsappPhone: maskPhoneNumber(l.whatsappPhone),
    })),
  };
}

export async function getListingBySlug(slug: string) {
  // SECURITY: Use public client for public listing access
  const listings = await getPublicDatabaseListings({ slug });
  if (!listings?.[0]) return null;
  return {
    ...listings[0],
    whatsappPhone: maskPhoneNumber(listings[0].whatsappPhone),
  };
}

export async function getListingById(id: string) {
  // SECURITY: Use public client for public listing access
  const listings = await getPublicDatabaseListings({ ids: [id] });
  if (!listings?.[0]) return null;
  return {
    ...listings[0],
    whatsappPhone: maskPhoneNumber(listings[0].whatsappPhone),
  };
}

export async function getAllApprovedListings() {
  // SECURITY: Use public client with RLS enforcement
  const listings = await getPublicDatabaseListings({
    statuses: ["approved"],
    filters: { limit: 100, page: 1 },
  });

  if (!listings) return [];

  return listings.map((l: Listing) => ({
    ...l,
    whatsappPhone: maskPhoneNumber(l.whatsappPhone),
  }));
}
