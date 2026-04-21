import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { Listing, ListingFilters, UserRole, Profile } from "@/types";
import { logger } from "@/lib/utils/logger";
import { ListingRow } from "./listing-submission-types";

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
  profiles!seller_id (
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

export function mapListingRow(row: ListingRow): Listing {
  return {
    brand: row.brand,
    city: row.city,
    createdAt: row.created_at,
    damageStatusJson: (row.damage_status_json as Record<string, string> | null) ?? null,
    description: row.description,
    district: row.district,
    expertInspection: row.expert_inspection ?? undefined,
    featured: row.featured,
    fraudReason: row.fraud_reason ?? null,
    fraudScore: row.fraud_score ?? 0,
    fuelType: row.fuel_type,
    id: row.id,
    images: (row.listing_images || [])
      .map((image) => ({
        id: image.id,
        isCover: image.is_cover || false,
        listingId: image.listing_id,
        order: image.sort_order || 0,
        storagePath: image.storage_path || "",
        url: image.public_url || "",
        placeholderBlur: image.placeholder_blur || null,
      }))
      .sort((left, right) => left.order - right.order),
    mileage: row.mileage,
    model: row.model,
    price: Number(row.price),
    carTrim: row.car_trim ?? null,
    sellerId: row.seller_id,
    viewCount: row.view_count ?? 0,
    seller: row.profiles ? {
      id: row.profiles.id,
      fullName: row.profiles.full_name,
      phone: row.profiles.phone ?? "",
      city: row.profiles.city,
      avatarUrl: row.profiles.avatar_url,
      role: row.profiles.role as UserRole,
      userType: row.profiles.user_type as Profile["userType"],
      businessName: row.profiles.business_name,
      businessLogoUrl: row.profiles.business_logo_url,
      isVerified: row.profiles.is_verified,
      isBanned: row.profiles.is_banned,
      banReason: row.profiles.ban_reason,
      verifiedBusiness: row.profiles.verified_business,
      businessSlug: row.profiles.business_slug,
      emailVerified: false,
      createdAt: row.profiles.created_at ?? "",
      updatedAt: row.profiles.updated_at ?? "",
    } : undefined,
    slug: row.slug,
    status: row.status,
    title: row.title,
    tramerAmount: row.tramer_amount != null ? Number(row.tramer_amount) : null,
    transmission: row.transmission,
    updatedAt: row.updated_at,
    bumpedAt: row.bumped_at ?? null,
    featuredUntil: row.featured_until ?? null,
    urgentUntil: row.urgent_until ?? null,
    highlightedUntil: row.highlighted_until ?? null,
    marketPriceIndex: row.market_price_index ? Number(row.market_price_index) : null,
    whatsappPhone: row.whatsapp_phone,
    vin: row.vin ?? null,
    licensePlate: row.license_plate ?? null,
    year: row.year,
    version: row.version ?? 0,
  };
}

export function applyListingFilterPredicates<T>(
  query: T,
  filters: ListingFilters,
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = query as any;

  if (filters.sellerId) q.eq("seller_id", filters.sellerId);
  if (filters.brand) q.eq("brand", filters.brand);
  if (filters.model) q.eq("model", filters.model);
  if (filters.carTrim) q.eq("car_trim", filters.carTrim);
  if (filters.city) q.eq("city", filters.city);
  if (filters.district) q.eq("district", filters.district);
  if (filters.fuelType) q.eq("fuel_type", filters.fuelType);
  if (filters.transmission) q.eq("transmission", filters.transmission);
  if (filters.minPrice !== undefined) q.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) q.lte("price", filters.maxPrice);
  if (filters.minYear !== undefined) q.gte("year", filters.minYear);
  if (filters.maxYear !== undefined) q.lte("year", filters.maxYear);
  if (filters.maxMileage !== undefined) q.lte("mileage", filters.maxMileage);
  if (filters.maxTramer !== undefined) {
    if (filters.maxTramer === 0) {
      q.or("tramer_amount.is.null,tramer_amount.eq.0");
    } else {
      q.lte("tramer_amount", filters.maxTramer);
    }
  }
  if (filters.hasExpertReport === true) {
    q.contains("expert_inspection", { hasInspection: true });
  }
  if (filters.query) {
    const terms = filters.query.trim().split(/\s+/).filter(Boolean);
    if (terms.length > 0) {
      const tsQuery = terms.map((t) => `${t}:*`).join(" & ");
      q.textSearch("search_vector", tsQuery, { config: "turkish_unaccent" });
    }
  }
  return q;
}

export async function getDatabaseListings(options?: {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
  filters?: ListingFilters;
}) {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();

  const applyQueryOptions = (selectClause: string) => {
    let query = admin.from("listings").select(selectClause);
    const sellerId = options?.sellerId ?? options?.filters?.sellerId;
    if (sellerId) query = query.eq("seller_id", sellerId);
    if (options?.listingId) query = query.eq("id", options.listingId);
    if (options?.slug) query = query.eq("slug", options.slug);
    if (options?.ids?.length) query = query.in("id", options.ids);
    if (options?.statuses?.length) query = query.in("status", options.statuses);

    // CRITICAL: Filter out listings from banned users
    query = query.eq("profiles.is_banned", false);

    const filters = options?.filters;
    if (filters) query = applyListingFilterPredicates(query, filters);

    const sort = filters?.sort ?? "newest";
    
    // PRIORITY 1: Featured (Paid)
    if (!filters?.sort || filters.sort === "newest") {
      query = query.order("featured", { ascending: false });
    }

    // PRIORITY 2: Trust-based priority (Natural boost for verified)
    query = query.order("profiles(verification_status)", { ascending: false, nullsFirst: false });

    switch (sort) {
      case "price_asc": query = query.order("price", { ascending: true }).order("created_at", { ascending: false }); break;
      case "price_desc": query = query.order("price", { ascending: false }).order("created_at", { ascending: false }); break;
      case "mileage_asc": query = query.order("mileage", { ascending: true }).order("created_at", { ascending: false }); break;
      case "year_desc": query = query.order("year", { ascending: false }).order("created_at", { ascending: false }); break;
      case "oldest": query = query.order("created_at", { ascending: true }); break;
      case "mileage_desc": query = query.order("mileage", { ascending: false }).order("created_at", { ascending: false }); break;
      case "year_asc": query = query.order("year", { ascending: true }).order("created_at", { ascending: false }); break;
      case "newest":
      default:
        query = query.order("bumped_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
        break;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return query.range(from, to);
  };

  const primaryResult = await applyQueryOptions(listingSelect).returns<ListingRow[]>();
  if (!primaryResult.error) return (primaryResult.data ?? []).map(mapListingRow);

  const fallbackResult = await applyQueryOptions(legacyListingSelect).returns<ListingRow[]>();
  if (fallbackResult.error || !fallbackResult.data) return null;
  return fallbackResult.data.map(mapListingRow);
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
  filters: ListingFilters,
): Promise<PaginatedListingsResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const sort = filters.sort ?? "newest";
  
  const admin = createSupabaseAdminClient();
  // const from = (page - 1) * limit; // OFFSET logic removed
  // const to = from + limit - 1;

  let dataQuery = admin.from("listings").select(listingSelect).eq("status", "approved");
  
  // CRITICAL: Filter out listings from banned users
  dataQuery = dataQuery.eq("profiles.is_banned", false);

  dataQuery = applyListingFilterPredicates(dataQuery, { ...filters, page, limit });

  // ── PILL: Issue 4 - Keyset (Cursor-based) Pagination ──────────────────
  if (filters.cursor) {
    try {
      const cursorData = JSON.parse(Buffer.from(filters.cursor, "base64").toString());
      
      // Keyset comparison depends on the sort order
      switch (sort) {
        case "newest":
          // Sort is Featured DESC, VerificationStatus DESC, BumpedAt DESC, CreatedAt DESC
          dataQuery = dataQuery.or(`featured.lt.${cursorData.featured},and(featured.eq.${cursorData.featured},bumped_at.lt.${cursorData.bumpedAt}),and(featured.eq.${cursorData.featured},bumped_at.eq.${cursorData.bumpedAt},created_at.lt.${cursorData.createdAt})`);
          break;
        case "price_asc":
          dataQuery = dataQuery.or(`price.gt.${cursorData.price},and(price.eq.${cursorData.price},created_at.lt.${cursorData.createdAt})`);
          break;
        case "price_desc":
          dataQuery = dataQuery.or(`price.lt.${cursorData.price},and(price.eq.${cursorData.price},created_at.lt.${cursorData.createdAt})`);
          break;
      }
    } catch {
      logger.db.warn("Invalid cursor provided", { cursor: filters.cursor });
    }
  }

  // PRIORITY 1: Featured (Paid)
  if (!filters.sort || filters.sort === "newest") {
    dataQuery = dataQuery.order("featured", { ascending: false });
  }

  // PRIORITY 2: Trust-based priority (Natural boost for verified)
  dataQuery = dataQuery.order("profiles(verification_status)", { ascending: false, nullsFirst: false });

  switch (sort) {
    case "price_asc": dataQuery = dataQuery.order("price", { ascending: true }).order("created_at", { ascending: false }); break;
    case "price_desc": dataQuery = dataQuery.order("price", { ascending: false }).order("created_at", { ascending: false }); break;
    case "mileage_asc": dataQuery = dataQuery.order("mileage", { ascending: true }).order("created_at", { ascending: false }); break;
    case "year_desc": dataQuery = dataQuery.order("year", { ascending: false }).order("created_at", { ascending: false }); break;
    case "oldest": dataQuery = dataQuery.order("created_at", { ascending: true }); break;
    case "mileage_desc": dataQuery = dataQuery.order("mileage", { ascending: false }).order("created_at", { ascending: false }); break;
    case "year_asc": dataQuery = dataQuery.order("year", { ascending: true }).order("created_at", { ascending: false }); break;
    case "newest":
    default:
      dataQuery = dataQuery
        .order("bumped_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
  }
  
  dataQuery = dataQuery.limit(limit);

  let countQuery = admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "approved");
  countQuery = applyListingFilterPredicates(countQuery, filters);

  const [dataResult, countResult] = await Promise.all([
    dataQuery.returns<ListingRow[]>(),
    countQuery,
  ]);

  if (dataResult.error) {
    logger.db.error("Failed to fetch listings data", undefined, {
      code: dataResult.error.code ?? undefined,
      details: dataResult.error.details ?? undefined,
      hint: dataResult.error.hint ?? undefined,
      message: dataResult.error.message,
    });
  }
  if (countResult.error) {
    logger.db.error("Failed to count listings", undefined, {
      code: countResult.error.code ?? undefined,
      details: countResult.error.details ?? undefined,
      hint: countResult.error.hint ?? undefined,
      message: countResult.error.message,
    });
  }

  const listings = dataResult.data ? dataResult.data.map(mapListingRow) : [];
  const totalCount = countResult.count ?? 0;

  // Build the next cursor based on the last item
  let nextCursor: string | undefined;
  if (listings.length > 0 && listings.length === limit) {
    const last = listings[listings.length - 1];
    const cursorData = {
      id: last.id,
      featured: last.featured,
      bumpedAt: last.bumpedAt,
      createdAt: last.createdAt,
      price: last.price,
    };
    nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
  }

  return {
    listings,
    total: totalCount,
    page,
    limit,
    hasMore: page * limit < totalCount,
    nextCursor,
  };
}
