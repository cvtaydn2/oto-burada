import { maskPhoneNumber } from "@/lib/utils/listing-utils";
import { ListingFilters } from "@/types";

import {
  getDatabaseListings,
  getFilteredDatabaseListings,
  PaginatedListingsResult,
} from "../listing-submission-query";

/**
 * Public catalog logic for marketplace display.
 * Focused on "read" operations with caching support.
 */

export async function getPublicListings(filters: ListingFilters): Promise<PaginatedListingsResult> {
  // getFilteredDatabaseListings handles standard marketplace filters (approved status by default)
  const result = await getFilteredDatabaseListings(filters);

  return {
    ...result,
    listings: result.listings.map((l) => ({
      ...l,
      whatsappPhone: maskPhoneNumber(l.whatsappPhone),
    })),
  };
}

export async function getListingBySlug(slug: string) {
  const listings = await getDatabaseListings({ slug });
  if (!listings?.[0]) return null;
  return {
    ...listings[0],
    whatsappPhone: maskPhoneNumber(listings[0].whatsappPhone),
  };
}

export async function getListingById(id: string) {
  const listings = await getDatabaseListings({ ids: [id] });
  if (!listings?.[0]) return null;
  return {
    ...listings[0],
    whatsappPhone: maskPhoneNumber(listings[0].whatsappPhone),
  };
}

export async function getAllApprovedListings() {
  // We can use getDatabaseListings with statuses or getFilteredDatabaseListings with defaults
  const listings = await getDatabaseListings({
    statuses: ["approved"],
    filters: { limit: 100, page: 1 },
  });

  if (!listings) return [];

  return listings.map((l) => ({
    ...l,
    whatsappPhone: maskPhoneNumber(l.whatsappPhone),
  }));
}
