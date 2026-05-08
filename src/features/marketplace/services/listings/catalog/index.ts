import { Listing, ListingFilters, ListingStatus } from "@/types";

import {
  getPublicDatabaseListings,
  getPublicFilteredDatabaseListings,
  PaginatedListingsResult,
} from "../listing-submission-query";

/**
 * Public catalog logic for marketplace display.
 * Focused on read operations with caching support.
 */

export async function getPublicListings(filters: ListingFilters): Promise<PaginatedListingsResult> {
  return getPublicFilteredDatabaseListings(filters);
}

export async function getListingBySlug(slug: string) {
  const listings = await getPublicDatabaseListings({ slug });
  if (!listings?.[0]) return null;
  return listings[0];
}

export async function getListingById(id: string) {
  const listings = await getPublicDatabaseListings({ ids: [id] });
  if (!listings?.[0]) return null;
  return listings[0];
}

export async function getAllApprovedListings() {
  const listings = await getPublicDatabaseListings({
    statuses: ["approved" as ListingStatus],
    filters: { limit: 100, page: 1 },
  });

  if (!listings) return [];

  return listings as Listing[];
}
