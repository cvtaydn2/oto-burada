import { createSupabaseServerClient } from "@/lib/server";

import {
  buildListingBaseQuery,
  getDatabaseListings as fetchDatabaseListings,
  listingSelect,
  PaginatedListingsResult,
} from "../listing-submission-query";
import { mapListingRow } from "../mappers/listing-row.mapper";

export async function getStoredUserListings(
  sellerId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedListingsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, count, error } = await buildListingBaseQuery(supabase, listingSelect, {
    sellerId,
    filters: { page, limit },
    withCount: true,
  });

  if (error) {
    return { listings: [], total: 0, page, limit, hasMore: false };
  }

  const listings = (data ?? []).map(mapListingRow);
  const total = count ?? 0;
  const hasMore = page * limit < total;

  return {
    listings,
    total,
    page,
    limit,
    hasMore,
  };
}

export async function getStoredListingBySlug(slug: string, options?: { includeBanned?: boolean }) {
  const databaseListings = await fetchDatabaseListings({
    slug,
    includeBanned: options?.includeBanned,
  });
  return databaseListings?.[0] ?? null;
}

export async function getStoredListingById(
  listingId: string,
  options?: { includeBanned?: boolean }
) {
  const databaseListings = await fetchDatabaseListings({
    ids: [listingId],
    includeBanned: options?.includeBanned,
  });
  return databaseListings?.[0] ?? null;
}

export async function getStoredListingsByIds(ids: string[], options?: { includeBanned?: boolean }) {
  if (ids.length === 0) return [];
  const databaseListings = await fetchDatabaseListings({
    ids,
    includeBanned: options?.includeBanned,
  });
  return databaseListings ?? [];
}
