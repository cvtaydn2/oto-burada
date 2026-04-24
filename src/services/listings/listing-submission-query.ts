/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import { logger } from "@/lib/utils/logger";
import { Listing, ListingFilters } from "@/types";

import { mapListingRow } from "./listing-submission-types";

export const listingSelect = `
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
  profiles!inner!seller_id (
    id,
    full_name,
    phone,
    city,
    avatar_url,
    role,
    user_type,
    business_name,
    business_logo_url,
    is_verified,
    is_banned,
    ban_reason,
    verified_business,
    verification_status,
    trust_score,
    business_slug,
    created_at,
    updated_at
  )
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
  )
`;

/**
 * OPTIMIZED select for marketplace list/grid display.
 * Excludes heavy fields like description, damage_status_json, etc.
 * Significant performance gain for LCP and memory usage.
 */
export const marketplaceListingSelect = `
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
  profiles!inner!seller_id (
    id,
    full_name,
    avatar_url,
    role,
    user_type,
    business_name,
    is_verified,
    verification_status,
    business_slug
  )
`;

export function applyListingFilterPredicates(query: any, filters: ListingFilters): any {
  let q = query;

  if (filters.sellerId) q = q.eq("seller_id", filters.sellerId);
  if (filters.brand) q = q.eq("brand", filters.brand);
  if (filters.model) q = q.eq("model", filters.model);
  if (filters.carTrim) q = q.eq("car_trim", filters.carTrim);
  if (filters.city) q = q.eq("city", filters.city);
  if (filters.district) q = q.eq("district", filters.district);
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
 */
function buildListingBaseQuery(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  selectClause: string,
  options?: {
    ids?: string[];
    listingId?: string;
    sellerId?: string;
    slug?: string;
    statuses?: Listing["status"][];
    filters?: ListingFilters;
  }
): any {
  let query = admin.from("listings").select(selectClause);

  // 1. Primary Identifiers
  const sellerId = options?.sellerId ?? options?.filters?.sellerId;
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (options?.listingId) query = query.eq("id", options.listingId);
  if (options?.slug) query = query.eq("slug", options.slug);
  if (options?.ids?.length) query = query.in("id", options.ids);
  if (options?.statuses?.length) query = query.in("status", options.statuses);

  // 2. Market Integrity: Filter out listings from banned users
  // This depends on the !inner join being present in the selectClause
  query = query.eq("profiles.is_banned", false);

  // 3. Predicates (Price, Year, Mileage, etc.)
  const filters = options?.filters;
  if (filters) query = applyListingFilterPredicates(query, filters);

  // 4. Sorting Hierarchy
  const sort = filters?.sort ?? "newest";

  // PRIORITY 1: Featured (Paid) - Always top for default/newest sorting
  if (!filters?.sort || filters.sort === "newest") {
    query = query.order("featured", { ascending: false });
  }

  // PRIORITY 2: Trust-based priority (Verified sellers boost)
  query = query.order("profiles(verification_status)", { ascending: false, nullsFirst: false });

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

  // 5. Pagination
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 50;
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
}): Promise<Listing[] | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const runQuery = async (query: any) => {
    return (query as any)["returns"]();
  };

  const primaryResult = await runQuery(buildListingBaseQuery(admin, listingSelect, options));
  if (!primaryResult.error) return (primaryResult.data ?? []).map(mapListingRow);

  // Fallback to legacy select if schema is in transition (graceful degradation)
  const fallbackResult = await runQuery(buildListingBaseQuery(admin, legacyListingSelect, options));
  if (fallbackResult.error || !fallbackResult.data) {
    if (fallbackResult.error) {
      logger.db.error("Listing retrieval failed after fallback", fallbackResult.error);
    }
    return null;
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

  const runQuery = async (query: any) => {
    return (query as any)["returns"]();
  };

  // Only allow approved listings for public access
  const publicOptions = {
    ...options,
    statuses: ["approved"] as Listing["status"][],
  };

  const result = await runQuery(buildListingBaseQuery(publicClient, listingSelect, publicOptions));
  if (result.error) {
    logger.db.error("Public listing retrieval failed", result.error);
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
}

export async function getFilteredDatabaseListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const admin = createSupabaseAdminClient();

  // Resolve citySlug to city name if city is not provided
  if (filters.citySlug && !filters.city) {
    const { data: cityData } = await admin
      .from("cities")
      .select("name")
      .eq("slug", filters.citySlug)
      .maybeSingle();

    if (cityData) {
      filters = { ...filters, city: cityData.name };
    }
  }

  // Core Data Query (Approved Only for public marketplace)
  const dataQuery = buildListingBaseQuery(admin, marketplaceListingSelect, {
    statuses: ["approved"],
    filters: { ...filters, page, limit },
  });

  // Count Query (Mirror the same filters for accurate pagination)
  const countQuery = buildListingBaseQuery(admin, "id", {
    statuses: ["approved"],
    filters: { ...filters, page: undefined, limit: undefined },
  });

  const [dataResult, countResult] = await Promise.all([
    (dataQuery as any)["returns"](),
    (countQuery as any)["returns"](),
  ]);

  if (dataResult.error) {
    logger.db.error("Filtered listing retrieval failed", dataResult.error);
    return { listings: [], total: 0, page, limit, hasMore: false };
  }

  const listings = (dataResult.data ?? []).map(mapListingRow);
  const total = countResult.data?.length ?? 0;
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

/**
 * SECURITY: Public filtered listings using RLS-enforced client
 * Use this for public marketplace queries that should respect RLS policies
 */
export async function getPublicFilteredDatabaseListings(
  filters: ListingFilters
): Promise<PaginatedListingsResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const publicClient = createSupabasePublicServerClient();

  // For city slug resolution, we still need admin client for reference data
  // This is acceptable as it's just reference data lookup
  if (filters.citySlug && !filters.city) {
    const admin = createSupabaseAdminClient();
    const { data: cityData } = await admin
      .from("cities")
      .select("name")
      .eq("slug", filters.citySlug)
      .maybeSingle();

    if (cityData) {
      filters = { ...filters, city: cityData.name };
    }
  }

  // Core Data Query (Approved Only for public marketplace, RLS enforced)
  const dataQuery = buildListingBaseQuery(publicClient, marketplaceListingSelect, {
    statuses: ["approved"],
    filters: { ...filters, page, limit },
  });

  // Count Query (Mirror the same filters for accurate pagination)
  const countQuery = buildListingBaseQuery(publicClient, "id", {
    statuses: ["approved"],
    filters: { ...filters, page: undefined, limit: undefined },
  });

  const [dataResult, countResult] = await Promise.all([
    (dataQuery as any)["returns"](),
    (countQuery as any)["returns"](),
  ]);

  if (dataResult.error) {
    logger.db.error("Public filtered listing retrieval failed", dataResult.error);
    return { listings: [], total: 0, page, limit, hasMore: false };
  }

  const listings = (dataResult.data ?? []).map(mapListingRow);
  const total = countResult.data?.length ?? 0;
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
