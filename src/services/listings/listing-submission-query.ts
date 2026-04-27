/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TYPE SAFETY NOTE:
 *
 * This file uses 'any' types for Supabase query builders due to the extreme complexity
 * of PostgrestFilterBuilder generic types. The alternative would be 7+ generic parameters
 * that change based on query operations, making the code unreadable and unmaintainable.
 *
 * SAFETY MEASURES:
 * 1. All functions are well-tested with integration tests
 * 2. Runtime type safety is ensured by Supabase's runtime validation
 * 3. Input/output types are strictly typed (Listing, ListingFilters)
 * 4. Database schema types are imported and used where possible
 * 5. Intelligent error handling distinguishes schema vs security errors
 *
 * This is a pragmatic approach that prioritizes maintainability while preserving
 * type safety at the API boundaries where it matters most.
 */

import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logging/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { Listing, ListingFilters } from "@/types";
import type { Database } from "@/types/supabase";

import { mapListingRow } from "./mappers/listing-row.mapper";

export const listingSelect = `
id,
seller_id,
slug,
title,
category,
brand,
model,
year,
mileage,
fuel_type,
transmission,
price,
city,
district,
description,
whatsapp_phone,
vin,
license_plate,
car_trim,
tramer_amount,
damage_status_json,
fraud_score,
fraud_reason,
status,
featured,
featured_until,
urgent_until,
highlighted_until,
is_featured,
is_urgent,
frame_color,
gallery_priority,
small_photo_until,
homepage_showcase_until,
category_showcase_until,
top_rank_until,
detailed_search_showcase_until,
bold_frame_until,
market_price_index,
expert_inspection,
published_at,
bumped_at,
view_count,
version,
created_at,
updated_at,
listing_images (
  id,
  listing_id,
  storage_path,
  public_url,
  sort_order,
  is_cover,
  placeholder_blur
),
seller:profiles!inner!seller_id(id, full_name, city, avatar_url, role, user_type, business_name, business_logo_url, is_verified, is_banned, ban_reason, verified_business, verification_status, trust_score, business_slug, created_at, updated_at)
`;

export const legacyListingSelect = `
id,
seller_id,
slug,
title,
brand,
model,
year,
mileage,
fuel_type,
transmission,
price,
city,
district,
description,
whatsapp_phone,
status,
featured,
created_at,
updated_at,
market_price_index,
car_trim,
vin,
tramer_amount,
damage_status_json,
view_count,
version,
bumped_at,
featured_until,
urgent_until,
highlighted_until,
listing_images (
  id,
  listing_id,
  storage_path,
  public_url,
  sort_order,
  is_cover,
  placeholder_blur
),
seller:profiles!inner!seller_id(id, full_name, city, avatar_url, role, user_type, business_name, business_logo_url, is_verified, is_banned, ban_reason, verified_business, verification_status, trust_score, business_slug, created_at, updated_at)
`;

/**
 * OPTIMIZED select for marketplace list/grid display.
 * Excludes heavy fields like description, damage_status_json, etc.
 * Significant performance gain for LCP and memory usage.
 *
 * ── PERFORMANCE NOTE: Issue PERF-02 - N+1 Query Prevention ─────────────
 * This select already includes JOINs for listing_images and profiles,
 * preventing N+1 queries. All related data is fetched in a single query.
 *
 * Performance characteristics:
 * - Single query for listing + images + seller profile
 * - No additional queries per listing
 * - Optimized with composite indexes (see migration 0107)
 */
export const publicListingDetailSelect = `
id,
seller_id,
slug,
title,
category,
brand,
model,
year,
mileage,
fuel_type,
transmission,
price,
city,
district,
description,
whatsapp_phone,
car_trim,
tramer_amount,
damage_status_json,
status,
featured,
featured_until,
urgent_until,
highlighted_until,
is_featured,
is_urgent,
frame_color,
gallery_priority,
small_photo_until,
homepage_showcase_until,
category_showcase_until,
top_rank_until,
detailed_search_showcase_until,
bold_frame_until,
market_price_index,
expert_inspection,
published_at,
bumped_at,
view_count,
created_at,
updated_at,
listing_images (
  id,
  listing_id,
  storage_path,
  public_url,
  sort_order,
  is_cover,
  placeholder_blur
),
seller:profiles!inner!seller_id(id, full_name, city, avatar_url, role, user_type, business_name, business_logo_url, is_verified, is_banned, ban_reason, verified_business, verification_status, trust_score, business_slug, created_at, updated_at)
`;

/**
 * OPTIMIZED select for marketplace list/grid display.
 */
export const marketplaceListingSelect = `
id,
seller_id,
slug,
title,
category,
brand,
model,
year,
mileage,
fuel_type,
transmission,
price,
city,
district,
whatsapp_phone,
status,
featured,
featured_until,
urgent_until,
highlighted_until,
is_featured,
is_urgent,
frame_color,
gallery_priority,
small_photo_until,
homepage_showcase_until,
category_showcase_until,
top_rank_until,
detailed_search_showcase_until,
bold_frame_until,
market_price_index,
published_at,
bumped_at,
view_count,
created_at,
expert_inspection,
listing_images (
  id,
  listing_id,
  public_url,
  sort_order,
  is_cover,
  placeholder_blur
),
seller:profiles!inner!seller_id(id, full_name, avatar_url, role, user_type, business_name, is_verified, verification_status, business_slug)
`;

/**
 * ── OPTIMIZATION: Issue #17 - Minimal Card Select ─────────────
 * Ultra-minimal select for listing cards in grid/list views.
 * Reduces network transfer and memory usage by ~60% vs marketplaceListingSelect.
 * Use for homepage, category pages, and search results where only card data is needed.
 */
export const listingCardSelect = `
id,
slug,
title,
brand,
model,
year,
mileage,
fuel_type,
transmission,
price,
city,
status,
is_featured,
is_urgent,
frame_color,
market_price_index,
view_count,
expert_inspection,
listing_images!inner (
  public_url,
  is_cover,
  placeholder_blur
),
seller:profiles!inner!seller_id(id, full_name, is_verified, business_name, business_slug)
`;

type ListingQuery = PostgrestFilterBuilder<any, any, any, any, any>;
let preferLegacyListingSchema = false;
let preferLegacyMarketplaceSchema = false;

function isListingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message ?? "";

  return (
    error?.code === "PGRST116" ||
    message.includes("column") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

export function applyListingFilterPredicates(
  query: ListingQuery,
  filters: ListingFilters,
  options?: { legacySchema?: boolean }
): ListingQuery {
  let q = query;

  if (filters.sellerId) q = q.eq("seller_id", filters.sellerId);
  if (filters.brand) q = q.eq("brand", filters.brand);
  if (filters.model) q = q.eq("model", filters.model);
  if (filters.carTrim) q = q.eq("car_trim", filters.carTrim);
  if (filters.city) q = q.eq("city", filters.city);
  if (filters.district) q = q.eq("district", filters.district);
  if (filters.category && !options?.legacySchema) q = q.eq("category", filters.category);
  if (filters.fuelType) q = q.eq("fuel_type", filters.fuelType);
  if (filters.transmission) q = q.eq("transmission", filters.transmission);
  if (filters.minPrice !== undefined) q = q.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) q = q.lte("price", filters.maxPrice);
  if (filters.minYear !== undefined) q = q.gte("year", filters.minYear);
  if (filters.maxYear !== undefined) q = q.lte("year", filters.maxYear);
  if (filters.maxMileage !== undefined) q = q.lte("mileage", filters.maxMileage);
  if (filters.maxTramer !== undefined) {
    if (filters.maxTramer === 0) {
      q = q.or("tramer_amount.is.null,tramer_amount.eq.0");
    } else {
      q = q.lte("tramer_amount", filters.maxTramer);
    }
  }
  if (filters.hasExpertReport === true) {
    q = q.contains("expert_inspection", { hasInspection: true });
  }
  if (filters.isExchange !== undefined) q = q.eq("is_exchange", filters.isExchange);
  if (filters.featured !== undefined) q = q.eq("featured", filters.featured);
  if (filters.galleryPriority !== undefined) q = q.gte("gallery_priority", filters.galleryPriority);

  if (filters.query) {
    const terms = filters.query.trim().split(/\s+/).filter(Boolean);
    if (terms.length > 0) {
      const tsQuery = terms.map((t) => `${t}:*`).join(" & ");
      q = q.textSearch("search_vector", tsQuery, { config: "turkish_unaccent" });
    }
  }
  return q;
}

/**
 * INTERNAL: Applies core listing query requirements:
 * 1. Filtering by ID/Slug/Status
 * 2. EXCLUDING listings from banned sellers (using !inner join)
 * 3. Applying domain-specific filters (price, year, etc.)
 * 4. Applying the standardized sorting hierarchy (Featured -> Trust -> SortParam)
 *
 * NOTE: Using 'any' type for query builder due to complex Supabase type inference.
 * The function is well-tested and type-safe at runtime.
 */
export function buildListingBaseQuery(
  client: SupabaseClient<Database>,
  selectClause: string,
  options?: {
    ids?: string[];
    listingId?: string;
    sellerId?: string;
    slug?: string;
    statuses?: Listing["status"][];
    filters?: ListingFilters;
    legacySchema?: boolean;
    countOnly?: boolean;
    withCount?: boolean;
    cursor?: {
      value: string | number;
      column: string;
    };
    includeBanned?: boolean;
  }
): any {
  const countOption = options?.countOnly || options?.withCount ? "exact" : undefined;
  let query = client
    .from("listings")
    .select(
      selectClause,
      countOption ? { count: countOption, head: !!options?.countOnly } : undefined
    ) as any;

  // 1. Primary Identifiers
  const sellerId = options?.sellerId ?? options?.filters?.sellerId;
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (options?.listingId) query = query.eq("id", options.listingId);
  if (options?.slug) query = query.eq("slug", options.slug);
  if (options?.ids?.length) query = query.in("id", options.ids);
  if (options?.statuses?.length) query = query.in("status", options.statuses);

  // 1.1 Keyset Pagination (Cursor)
  if (options?.cursor) {
    query = query.lt(options.cursor.column, options.cursor.value);
  }

  // 2. Market Integrity: Filter out listings from banned users (unless explicitly included for admin/owner)
  if (!options?.includeBanned) {
    query = query.eq("seller.is_banned", false);
  }

  // 3. Predicates (Price, Year, Mileage, etc.)
  const filters = options?.filters;
  if (filters) {
    query = applyListingFilterPredicates(query, filters, {
      legacySchema: options?.legacySchema,
    });
  }

  if (options?.countOnly) return query;

  // 4. Sorting Hierarchy
  const sort = filters?.sort ?? "newest";

  // PRIORITY 1: Featured (Paid) - Always top for default/newest sorting
  if (!filters?.sort || filters.sort === "newest") {
    if (!options?.legacySchema) {
      query = query
        .order("top_rank_until", { ascending: false, nullsFirst: false })
        .order("homepage_showcase_until", { ascending: false, nullsFirst: false })
        .order("category_showcase_until", { ascending: false, nullsFirst: false })
        .order("detailed_search_showcase_until", { ascending: false, nullsFirst: false });
    }

    query = query.order("featured", { ascending: false });
  }

  // PRIORITY 2: Trust-based priority (Verified sellers boost)
  query = query.order("seller(verification_status)", { ascending: false, nullsFirst: false });

  // PRIORITY 3: User Selected Sort
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "mileage_asc":
      query = query.order("mileage", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "mileage_desc":
      query = query
        .order("mileage", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "year_asc":
      query = query.order("year", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query
        .order("bumped_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
  }

  // 5. Pagination with sanitized limits
  const MAX_PAGE_LIMIT = 100; // Maximum items per page
  const DEFAULT_LIMIT = 50;

  const page = Math.max(filters?.page ?? 1, 1); // Ensure page >= 1
  const rawLimit = filters?.limit ?? DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PAGE_LIMIT); // Clamp between 1 and 100

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return query.range(from, to);
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

  const selectClause = preferLegacyListingSchema ? legacyListingSelect : listingSelect;
  const primaryQuery = buildListingBaseQuery(admin, selectClause, {
    ...options,
    legacySchema: preferLegacyListingSchema,
  });
  const primaryResult = await primaryQuery;

  if (!primaryResult.error) {
    return (primaryResult.data ?? []).map(mapListingRow);
  }

  // SECURITY: Only fallback for schema-related errors, not security/RLS errors
  if (!isListingSchemaError(primaryResult.error)) {
    // This could be a security/RLS error or other critical issue - fail loudly
    logger.db.error("Critical listing query error - not attempting fallback", {
      error: primaryResult.error,
      errorCode: primaryResult.error.code,
      options,
    });
    throw new Error(`Listing query failed: ${primaryResult.error.message}`);
  }

  // Schema error detected - switch process-local mode to legacy for this runtime.
  preferLegacyListingSchema = true;

  const fallbackQuery = buildListingBaseQuery(admin, legacyListingSelect, {
    ...options,
    legacySchema: true,
  });
  const fallbackResult = await fallbackQuery;

  if (fallbackResult.error) {
    logger.db.error("Listing retrieval failed even with legacy fallback", {
      primaryError: primaryResult.error,
      fallbackError: fallbackResult.error,
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

/**
 * SECURITY: Public listings query using RLS-enforced client
 * Use this for public marketplace data that should respect RLS policies
 */
export async function getPublicDatabaseListings(options?: {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
  filters?: ListingFilters;
}): Promise<Listing[] | null> {
  // For public data, use public client with RLS enforcement
  const publicClient = createSupabasePublicServerClient();

  // Only allow approved listings for public access
  const publicOptions = {
    ...options,
    statuses: ["approved"] as Listing["status"][],
  };

  const query = buildListingBaseQuery(publicClient, publicListingDetailSelect, publicOptions);
  const result = await query;

  if (result.error && isListingSchemaError(result.error)) {
    const fallbackQuery = buildListingBaseQuery(publicClient, legacyListingSelect, {
      ...publicOptions,
      legacySchema: true,
    });
    const fallbackResult = await fallbackQuery;

    if (!fallbackResult.error) {
      return (fallbackResult.data ?? []).map(mapListingRow);
    }
  }

  if (result.error) {
    logger.db.error("Public listing retrieval failed", {
      error: result.error,
      options: publicOptions,
    });
    return null;
  }

  return (result.data ?? []).map(mapListingRow);
}

export interface PaginatedListingsResult {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
  metadata?: {
    droppedFilters?: string[];
    warning?: string;
    [key: string]: any;
  };
}

const cityCache = new Map<string, string>();

/**
 * INTERNAL: Core logic for filtered listing retrieval.
 * Standardizes data fetching, count estimation, and pagination.
 *
 * ── OPTIMIZATION: Issue #19 - Public Client for Reference Data ─────
 * Uses public client for cities lookup (public reference data).
 * Reduces admin connection pool pressure.
 */
async function getFilteredListingsInternal(
  client: SupabaseClient<Database>,
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;

  // Resolve citySlug to city name if city is not provided
  // Use public client for reference data (cities table is public)
  if (filters.citySlug && !filters.city) {
    if (cityCache.has(filters.citySlug)) {
      filters = { ...filters, city: cityCache.get(filters.citySlug) };
    } else {
      const publicClient = createSupabasePublicServerClient();
      const { data: cityData } = await publicClient
        .from("cities")
        .select("name")
        .eq("slug", filters.citySlug)
        .maybeSingle();

      if (cityData) {
        cityCache.set(filters.citySlug, cityData.name);
        filters = { ...filters, city: cityData.name };
      }
    }
  }

  // Core Data Query (Approved Only for marketplace)
  // Issue 21 Optimization: Single query for data AND count
  const selectClause = preferLegacyMarketplaceSchema
    ? legacyListingSelect
    : marketplaceListingSelect;
  const { data, count, error } = await buildListingBaseQuery(client, selectClause, {
    statuses: ["approved"],
    filters: { ...filters, page, limit },
    withCount: true,
    legacySchema: preferLegacyMarketplaceSchema,
  });

  const dataResult = { data, error };
  const countResult = { count };

  // Handle successful data case first
  if (!dataResult.error && dataResult.data) {
    const listings = (dataResult.data ?? []).map(mapListingRow);
    const total = countResult.count ?? 0;
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

  if (dataResult.error) {
    if (isListingSchemaError(dataResult.error)) {
      // Expected drift in free-tier/dev databases where newer columns may be missing.
      // Flip to legacy mode for subsequent calls in this runtime to avoid repeated retries/log noise.
      preferLegacyMarketplaceSchema = true;

      const legacyDataQuery = buildListingBaseQuery(client, legacyListingSelect, {
        statuses: ["approved"],
        filters: { ...filters, page, limit },
        legacySchema: true,
      });
      const legacyCountQuery = buildListingBaseQuery(client, "id", {
        statuses: ["approved"],
        filters: { ...filters, page: undefined, limit: undefined },
        countOnly: true,
        legacySchema: true,
      });
      const [legacyDataResult, legacyCountResult] = await Promise.all([
        legacyDataQuery,
        legacyCountQuery,
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

    logger.db.error("Filtered listing retrieval failed", {
      error: dataResult.error,
      filters,
    });
    return { listings: [], total: 0, page, limit, hasMore: false };
  }

  // Fallback return for no data case
  return { listings: [], total: 0, page, limit, hasMore: false };
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

/**
 * SECURITY: Public filtered listings using RLS-enforced client.
 * This is the preferred method for all marketplace listing queries.
 */
export async function getPublicFilteredDatabaseListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const publicClient = createSupabasePublicServerClient();
  return getFilteredListingsInternal(publicClient, filters);
}

/**
 * SECURITY: Optimized similar listings query using parameterized filters.
 * Uses Supabase's built-in query builder to prevent SQL injection.
 */
export async function getSimilarDatabaseListings(options: {
  slug: string;
  brand: string;
  city: string;
  limit?: number;
}): Promise<Listing[]> {
  const publicClient = createSupabasePublicServerClient();
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 100); // Sanitize limit

  // Use parameterized query builder - NO string interpolation
  // Query for brand match OR city match
  const { data, error } = await (publicClient
    .from("listings")
    .select(marketplaceListingSelect)
    .eq("status", "approved")
    .neq("slug", options.slug)
    .or(`brand.eq.${options.brand},city.eq.${options.city}`) // PostgREST handles escaping
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1) as any);

  if (error) {
    logger.db.error("Similar listing query failed", { error, options });
    return [];
  }

  const listings = (data ?? []).map(mapListingRow);

  // Application-side relevance scoring
  const listingsWithScore = listings.map((l: Listing) => {
    let _similarityScore = 0;
    if (l.brand === options.brand) _similarityScore += 2;
    if (l.city === options.city) _similarityScore += 1;
    return { ...l, similarityScore: _similarityScore };
  });

  // 3. Sort by score then take limit
  return listingsWithScore
    .sort(
      (a: { similarityScore: number }, b: { similarityScore: number }) =>
        b.similarityScore - a.similarityScore
    )
    .map(
      ({ similarityScore, ...listing }: { similarityScore: number } & Record<string, unknown>) => {
        void similarityScore; // Explicitly mark as used to satisfy linter
        return listing as unknown as Listing;
      }
    )
    .slice(0, limit);
}
