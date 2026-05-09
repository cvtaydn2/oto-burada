import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import type { Listing, ListingFilters } from "@/types";
import type { Database } from "@/types/supabase";

import { buildListingBaseQuery } from "./listing-query-builder";
import {
  isListingSchemaError,
  isTransientFetchError,
  markLegacyListingSchemaPreferred,
  markLegacyMarketplaceSchemaPreferred,
  preferLegacyListingSchema,
  preferLegacyMarketplaceSchema,
  runQueryWithTransientRetry,
} from "./listing-query-fallback";
import {
  legacyListingSelect,
  listingCardSelect,
  listingSelect,
  marketplaceListingSelect,
  publicListingDetailSelect,
} from "./listing-query-selects";
import {
  type ListingQueryResult,
  type PaginatedListingsResult,
  type SimilarListingsOptions,
} from "./listing-query-types";
import { type ListingRow, mapListingRow } from "./mappers/listing-row.mapper";

const cityCache = new Map<string, string>();

async function resolveCityFilter(filters: ListingFilters): Promise<ListingFilters> {
  if (!filters.citySlug || filters.city) {
    return filters;
  }

  if (cityCache.has(filters.citySlug)) {
    return { ...filters, city: cityCache.get(filters.citySlug) };
  }

  const publicClient = createSupabasePublicServerClient();
  const { data: cityData } = await publicClient
    .from("cities")
    .select("name")
    .eq("slug", filters.citySlug)
    .maybeSingle();

  if (!cityData) {
    return filters;
  }

  cityCache.set(filters.citySlug, cityData.name);
  return { ...filters, city: cityData.name };
}

async function getFilteredListingsInternal(
  client: SupabaseClient<Database>,
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const resolvedFilters = await resolveCityFilter(filters);

  const selectClause = preferLegacyMarketplaceSchema()
    ? legacyListingSelect
    : marketplaceListingSelect;

  const { data, count, error }: ListingQueryResult = await runQueryWithTransientRetry(
    () =>
      buildListingBaseQuery(client, selectClause, {
        statuses: ["approved"],
        filters: { ...resolvedFilters, page, limit },
        withCount: true,
        legacySchema: preferLegacyMarketplaceSchema(),
      }),
    "getFilteredListingsInternal.primaryQuery"
  );

  if (!error && data) {
    const listings = data.map(mapListingRow);
    const total = count ?? 0;
    const hasMore = page * limit < total;

    return {
      listings,
      total,
      page,
      limit,
      hasMore,
      nextCursor: hasMore ? String(page + 1) : undefined,
    };
  }

  if (error && isListingSchemaError(error)) {
    markLegacyMarketplaceSchemaPreferred();

    const legacyDataQuery = buildListingBaseQuery(client, legacyListingSelect, {
      statuses: ["approved"],
      filters: { ...resolvedFilters, page, limit },
      legacySchema: true,
    });
    const legacyCountQuery = buildListingBaseQuery(client, "id", {
      statuses: ["approved"],
      filters: { ...resolvedFilters, page: undefined, limit: undefined },
      countOnly: true,
      legacySchema: true,
    });

    const [legacyDataResult, legacyCountResult]: [ListingQueryResult, ListingQueryResult] =
      await Promise.all([
        runQueryWithTransientRetry(
          () => legacyDataQuery,
          "getFilteredListingsInternal.legacyDataQuery"
        ),
        runQueryWithTransientRetry(
          () => legacyCountQuery,
          "getFilteredListingsInternal.legacyCountQuery"
        ),
      ]);

    if (!legacyDataResult.error) {
      const listings = (legacyDataResult.data ?? []).map(mapListingRow);
      const total = legacyCountResult.count ?? listings.length;
      const hasMore = page * limit < total;

      return {
        listings,
        total,
        page,
        limit,
        hasMore,
        nextCursor: hasMore ? String(page + 1) : undefined,
      };
    }
  }

  if (error) {
    logger.db.error("Filtered listing retrieval failed", error, {
      filters: resolvedFilters,
    });
  }

  return { listings: [], total: 0, page, limit, hasMore: false };
}

export async function getDatabaseListings(options?: {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
  filters?: ListingFilters;
  includeBanned?: boolean;
}): Promise<Listing[] | null> {
  if (!hasSupabaseAdminEnv()) return null;

  const admin = createSupabaseAdminClient();
  const useLegacySchema = preferLegacyListingSchema();
  const selectClause = useLegacySchema ? legacyListingSelect : listingSelect;
  const primaryQuery = buildListingBaseQuery(admin, selectClause, {
    ...options,
    legacySchema: useLegacySchema,
  });

  const primaryResult: ListingQueryResult = await runQueryWithTransientRetry(
    () => primaryQuery,
    "getDatabaseListings.primaryQuery"
  );

  if (!primaryResult.error) {
    return (primaryResult.data ?? []).map(mapListingRow);
  }

  if (!isListingSchemaError(primaryResult.error)) {
    if (isTransientFetchError(new Error(primaryResult.error.message ?? ""))) {
      logger.db.warn("Transient listing query error in admin path; returning null", {
        options,
        message: primaryResult.error.message,
      });
      return null;
    }

    logger.db.error("Critical listing query error - not attempting fallback", primaryResult.error, {
      options,
    });
    throw new Error(`Listing query failed: ${primaryResult.error.message}`);
  }

  markLegacyListingSchemaPreferred();

  const fallbackQuery = buildListingBaseQuery(admin, legacyListingSelect, {
    ...options,
    legacySchema: true,
  });

  const fallbackResult: ListingQueryResult = await runQueryWithTransientRetry(
    () => fallbackQuery,
    "getDatabaseListings.fallbackQuery"
  );

  if (fallbackResult.error) {
    logger.db.error("Listing retrieval failed even with legacy fallback", fallbackResult.error, {
      primaryError: primaryResult.error.message,
      options,
    });
    throw new Error(
      `Both primary and fallback listing queries failed: ${fallbackResult.error.message}`
    );
  }

  if (!fallbackResult.data) {
    logger.db.warn("Fallback query succeeded but returned no data", { options });
    return [];
  }

  return fallbackResult.data.map(mapListingRow);
}

export async function getPublicDatabaseListings(options?: {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
  filters?: ListingFilters;
}): Promise<Listing[] | null> {
  const publicClient = createSupabasePublicServerClient();
  const publicOptions = {
    ...options,
    statuses: ["approved"] as Listing["status"][],
  };

  const query = buildListingBaseQuery(publicClient, publicListingDetailSelect, publicOptions);
  const result: ListingQueryResult = await runQueryWithTransientRetry(
    () => query,
    "getPublicDatabaseListings.query"
  );

  if (result.error && isListingSchemaError(result.error)) {
    const fallbackQuery = buildListingBaseQuery(publicClient, legacyListingSelect, {
      ...publicOptions,
      legacySchema: true,
    });
    const fallbackResult: ListingQueryResult = await runQueryWithTransientRetry(
      () => fallbackQuery,
      "getPublicDatabaseListings.fallbackQuery"
    );

    if (!fallbackResult.error) {
      return (fallbackResult.data ?? []).map(mapListingRow);
    }
  }

  if (result.error) {
    logger.db.error("Public listing retrieval failed", result.error, {
      options: publicOptions,
    });
    return null;
  }

  return (result.data ?? []).map(mapListingRow);
}

/**
 * @deprecated Use getPublicFilteredDatabaseListings for marketplace queries.
 * This function uses the admin client and bypasses RLS.
 */
export async function getFilteredDatabaseListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const admin = createSupabaseAdminClient();
  return getFilteredListingsInternal(admin, filters);
}

export async function getPublicFilteredDatabaseListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const publicClient = createSupabasePublicServerClient();
  return getFilteredListingsInternal(publicClient, filters);
}

export async function getSimilarDatabaseListings(
  options: SimilarListingsOptions
): Promise<Listing[]> {
  const publicClient = createSupabasePublicServerClient();
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 100);
  const safeBrand = `"${options.brand.replace(/"/g, '""')}"`;
  const safeCity = `"${options.city.replace(/"/g, '""')}"`;

  const { data, error } = await runQueryWithTransientRetry(
    async () =>
      await publicClient
        .from("listings")
        .select(listingCardSelect)
        .eq("status", "approved")
        .neq("slug", options.slug)
        .or(`brand.eq.${safeBrand},city.eq.${safeCity}`)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, limit - 1),
    "getSimilarDatabaseListings.query"
  );

  if (error) {
    logger.db.error("Similar listing query failed", { error, options });
    return [];
  }

  const listings = ((data ?? []) as unknown as ListingRow[]).map(mapListingRow);

  return listings
    .sort((a, b) => {
      const scoreA = (a.brand === options.brand ? 2 : 0) + (a.city === options.city ? 1 : 0);
      const scoreB = (b.brand === options.brand ? 2 : 0) + (b.city === options.city ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
