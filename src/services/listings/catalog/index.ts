import { 
  getDatabaseListings, 
  getFilteredDatabaseListings, 
  PaginatedListingsResult 
} from "../listing-submission-query";
import { ListingFilters } from "@/types";

/**
 * Public catalog logic for marketplace display.
 * Focused on "read" operations with caching support.
 */

export async function getPublicListings(filters: ListingFilters): Promise<PaginatedListingsResult> {
  // getFilteredDatabaseListings handles standard marketplace filters (approved status by default)
  return getFilteredDatabaseListings(filters);
}

export async function getListingBySlug(slug: string) {
  const listings = await getDatabaseListings({ slug });
  return listings?.[0] ?? null;
}

export async function getListingById(id: string) {
  const listings = await getDatabaseListings({ ids: [id] });
  return listings?.[0] ?? null;
}

export async function getAllApprovedListings() {
  // We can use getDatabaseListings with statuses or getFilteredDatabaseListings with defaults
  const listings = await getDatabaseListings({ 
    statuses: ["approved"],
    filters: { limit: 100, page: 1 }
  });
  return listings ?? [];
}
