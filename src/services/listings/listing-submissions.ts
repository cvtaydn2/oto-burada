import { cookies } from "next/headers";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { listingSchema } from "@/lib/validators";
import type { Listing, ListingCreateInput, ListingFilters, UserRole, Profile } from "@/types";
import { listingSubmissionsCookieName } from "./constants";
import { logger } from "@/lib/utils/logger";

const turkishCharacterMap: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

interface ListingImageRow {
  id: string;
  is_cover: boolean;
  listing_id: string;
  public_url: string;
  sort_order: number;
  storage_path: string;
  placeholder_blur: string | null;
}

interface ListingRow {
  brand: string;
  city: string;
  created_at: string;
  damage_status_json?: Record<string, unknown> | null;
  description: string;
  district: string;
  expert_inspection?: Listing["expertInspection"] | null;
  featured: boolean;
  fraud_reason?: string | null;
  fraud_score?: number | null;
  fuel_type: Listing["fuelType"];
  id: string;
  listing_images?: ListingImageRow[] | null;
  profiles?: {
    full_name: string;
    phone: string;
    city: string;
    avatar_url: string | null;
    role: string;
    user_type: string;
    business_name: string | null;
    business_logo_url: string | null;
    is_verified: boolean;
    verified_business: boolean;
    business_slug: string | null;
  } | null;
  mileage: number;
  model: string;
  price: number;
  view_count?: number;
  seller_id: string;
  slug: string;
  status: Listing["status"];
  title: string;
  tramer_amount?: number | null;
  transmission: Listing["transmission"];
  updated_at: string;
  bumped_at?: string | null;
  featured_until?: string | null;
  urgent_until?: string | null;
  highlighted_until?: string | null;
  eids_verification_json?: Record<string, unknown> | null;
  market_price_index?: number | null;
  whatsapp_phone: string;
  year: number;
  vin?: string | null;
  car_trim?: string | null;
}

const listingSelect = `
  *,
  listing_images (
    id,
    listing_id,
    storage_path,
    public_url,
    sort_order,
    is_cover,
    placeholder_blur
  ),
  market_price_index,
  car_trim,
  whatsapp_phone,
  year,
  vin,
  profiles!seller_id (
    full_name,
    phone,
    city,
    avatar_url,
    role,
    user_type,
    business_name,
    business_logo_url,
    is_verified,
    verified_business,
    business_slug
  )
`;

const legacyListingSelect = `
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

function toSlugSegment(value: string) {
  return value
    .split("")
    .map((character) => turkishCharacterMap[character] ?? character)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildListingSlug(input: ListingCreateInput, existingListings: Listing[]) {
  const baseSlug = toSlugSegment(`${input.year} ${input.brand} ${input.model} ${input.title}`);
  const existingSlugs = new Set(existingListings.map((listing) => listing.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export function calculateFraudScore(input: ListingCreateInput, existingListings: Listing[]): { fraudScore: number, fraudReason: string | null } {
  let score = 0;
  const reasons: string[] = [];

  const isDuplicate = existingListings.some(
    (l) => l.brand === input.brand && l.model === input.model && l.year === input.year && l.mileage === input.mileage && l.price === input.price && l.sellerId !== "" // Assuming seller constraints
  );
  if (isDuplicate) {
    score += 50;
    reasons.push("Mükerrer ilan şüphesi");
  }

  const vinDuplicate = existingListings.find(
    (l) => l.vin === input.vin && l.sellerId !== "" && l.status !== "archived" && l.status !== "rejected"
  );
  if (vinDuplicate) {
    score += 100;
    reasons.push("Aynı şasi numaralı başka bir aktif ilan mevcut (VIN clone)");
  }

  if (input.year >= 2018 && input.price < 300000) {
    score += 60;
    reasons.push("Pazar ortalamasının çok altında şüpheli fiyat");
  }

  if (input.damageStatusJson && input.tramerAmount === 0) {
    const suspiciousStatuses = ["boyali", "lokal_boyali", "degisen"];
    const changedPartsCount = Object.values(input.damageStatusJson).filter((s) =>
      suspiciousStatuses.includes(s as string),
    ).length;

    if (changedPartsCount >= 3) {
      score += 20;
      reasons.push("Çoklu boya/değişen kaydına rağmen hasar kaydı 0");
    }
  }

  return { fraudScore: Math.min(score, 100), fraudReason: reasons.length > 0 ? reasons.join(", ") : null };
}

export function buildListingRecord(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: Listing[],
  options?: {
    existingListing?: Listing;
    id?: string;
    status?: Listing["status"];
  },
) {
  const existingListing = options?.existingListing;
  const id = existingListing?.id ?? options?.id ?? crypto.randomUUID();
  const slug = buildListingSlug(
    input,
    existingListing
      ? existingListings.filter((listing) => listing.id !== existingListing.id)
      : existingListings,
  );
  const fraudAssessment = calculateFraudScore(
    input,
    existingListing
      ? existingListings.filter((listing) => listing.id !== existingListing.id)
      : existingListings,
  );
  const timestamp = new Date().toISOString();

  return listingSchema.parse({
    id,
    slug,
    sellerId,
    viewCount: existingListing?.viewCount ?? 0,
    title: input.title,
    brand: input.brand,
    model: input.model,
    year: input.year,
    mileage: input.mileage,
    fuelType: input.fuelType,
    transmission: input.transmission,
    price: input.price,
    city: input.city,
    district: input.district,
    description: input.description,
    whatsappPhone: input.whatsappPhone,
    vin: input.vin,
    tramerAmount: input.tramerAmount ?? null,
    damageStatusJson: input.damageStatusJson ?? null,
    fraudScore: fraudAssessment.fraudScore,
    fraudReason: fraudAssessment.fraudReason,
    status: options?.status ?? existingListing?.status ?? "pending",
    featured: existingListing?.featured ?? false,
    expertInspection: input.expertInspection,
    bumpedAt: existingListing?.bumpedAt ?? null,
    featuredUntil: existingListing?.featuredUntil ?? null,
    urgentUntil: existingListing?.urgentUntil ?? null,
    highlightedUntil: existingListing?.highlightedUntil ?? null,
    eidsVerificationJson: (existingListing as Listing | undefined)?.eidsVerificationJson ?? null,
    marketPriceIndex: existingListing?.marketPriceIndex ?? null,
    createdAt: existingListing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    images: input.images.map((image, index) => ({
      id: `${id}-image-${index + 1}`,
      listingId: id,
      storagePath: image.storagePath,
      url: image.url,
      order: index,
      isCover: index === 0,
    })),
  });
}

function mapListingRow(row: ListingRow): Listing {
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
    price: row.price,
    carTrim: row.car_trim ?? null,
    sellerId: row.seller_id,
    viewCount: row.view_count ?? 0,
    seller: row.profiles ? {
      fullName: row.profiles.full_name,
      phone: row.profiles.phone,
      city: row.profiles.city,
      avatarUrl: row.profiles.avatar_url,
      role: row.profiles.role as UserRole,
      userType: row.profiles.user_type as Profile["userType"],
      businessName: row.profiles.business_name,
      businessLogoUrl: row.profiles.business_logo_url,
      identityVerified: row.profiles.is_verified,
      verifiedBusiness: row.profiles.verified_business,
      businessSlug: row.profiles.business_slug
    } : undefined,
    slug: row.slug,
    status: row.status,
    title: row.title,
    tramerAmount: row.tramer_amount ?? null,
    transmission: row.transmission,
    updatedAt: row.updated_at,
    bumpedAt: row.bumped_at ?? null,
    featuredUntil: row.featured_until ?? null,
    urgentUntil: row.urgent_until ?? null,
    highlightedUntil: row.highlighted_until ?? null,
    eidsVerificationJson: (row.eids_verification_json as Record<string, unknown> | null) ?? null,
    marketPriceIndex: row.market_price_index ? Number(row.market_price_index) : null,
    whatsappPhone: row.whatsapp_phone,
    vin: row.vin ?? null,
    year: row.year,
  };
}

export async function getDatabaseListings(options?: {
  ids?: string[];
  listingId?: string;
  sellerId?: string;
  slug?: string;
  statuses?: Listing["status"][];
  filters?: ListingFilters;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const applyListingQueryOptions = (selectClause: string) => {
    let query = admin.from("listings").select(selectClause);

    const sellerId = options?.sellerId ?? options?.filters?.sellerId;
    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }

    if (options?.listingId) {
      query = query.eq("id", options.listingId);
    }

    if (options?.slug) {
      query = query.eq("slug", options.slug);
    }

    if (options?.ids?.length) {
      query = query.in("id", options.ids);
    }

    if (options?.statuses?.length) {
      query = query.in("status", options.statuses);
    }

    const filters = options?.filters;

    if (filters) {
      if (filters.brand) {
        query = query.eq("brand", filters.brand);
      }

      if (filters.model) {
        query = query.eq("model", filters.model);
      }

      if (filters.carTrim) {
        query = query.eq("car_trim", filters.carTrim);
      }

      if (filters.city) {
        query = query.eq("city", filters.city);
      }

      if (filters.district) {
        query = query.eq("district", filters.district);
      }

      if (filters.fuelType) {
        query = query.eq("fuel_type", filters.fuelType);
      }

      if (filters.transmission) {
        query = query.eq("transmission", filters.transmission);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.minYear !== undefined) {
        query = query.gte("year", filters.minYear);
      }

      if (filters.maxYear !== undefined) {
        query = query.lte("year", filters.maxYear);
      }

      if (filters.maxMileage !== undefined) {
        query = query.lte("mileage", filters.maxMileage);
      }

      if (filters.maxTramer !== undefined) {
        query = query.lte("tramer_amount", filters.maxTramer);
      }

      if (filters.hasExpertReport === true) {
        // We filter for listings where expert_inspection has hasInspection: true
        // In Postgres with JSONB: expert_inspection->>'hasInspection' = 'true'
        query = query.filter("expert_inspection->>hasInspection", "eq", "true");
      }

      if (filters.query) {
        const terms = filters.query.trim().split(/\s+/).filter(Boolean);

        if (terms.length > 0) {
          const tsQuery = terms.map((t) => `${t}:*`).join(" & ");
          query = query.textSearch("search_vector", tsQuery);
        }
      }
    }

    const sort = filters?.sort ?? "newest";
    
    // Default "newest" view prioritizes featured listings.
    // Explicit sorts (price, mileage, year) respect the user's choice as primary.
    if (!filters?.sort || filters.sort === "newest") {
      query = query.order("featured", { ascending: false });
    }

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
        query = query.order("mileage", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "year_asc":
        query = query.order("year", { ascending: true }).order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        // Use bumped_at if available for improved recency
        query = query.order("bumped_at", { ascending: false, nullsFirst: false })
                     .order("created_at", { ascending: false });
        break;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return query.range(from, to);
  };

  const primaryResult = await applyListingQueryOptions(listingSelect).returns<ListingRow[]>();

  if (primaryResult.error) {
    logger.listings.error("getDatabaseListings primary query failed", primaryResult.error, {
      message: primaryResult.error.message,
    });
  }
  
  if (primaryResult.data && primaryResult.data.length > 0) {
    return primaryResult.data.map(mapListingRow);
  }

  // Fallback if primary fails or returns no data (could be schema mismatch)
  const fallbackResult = await applyListingQueryOptions(legacyListingSelect).returns<ListingRow[]>();

  if (fallbackResult.error || !fallbackResult.data) {
    if (fallbackResult.error) {
      logger.listings.error("getDatabaseListings fallback query failed", fallbackResult.error, {
        message: fallbackResult.error.message,
      });
    }
    return null;
  }

  return fallbackResult.data.map(mapListingRow);
}

export interface PaginatedListingsResult {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getFilteredDatabaseListings(
  filters: ListingFilters,
): Promise<PaginatedListingsResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const sort = filters.sort ?? "newest";
  const isDefaultView =
    !filters.query &&
    !filters.brand &&
    !filters.model &&
    !filters.city &&
    page === 1 &&
    sort === "newest";
  const cacheKey = "listings:approved:default";

  if (isDefaultView) {
    const { getCachedData } = await import("@/lib/redis/client");
    const cached = await getCachedData<PaginatedListingsResult>(cacheKey);
    if (cached) return cached;
  }

  const listings = await getDatabaseListings({
    statuses: ["approved"],
    filters: { ...filters, page, limit },
  });

  // Get total count with same filters but no pagination
  const countAdmin = createSupabaseAdminClient();
  let countQuery = countAdmin.from("listings").select("id", { count: "exact", head: true });
  countQuery = countQuery.eq("status", "approved");

  if (filters.sellerId) countQuery = countQuery.eq("seller_id", filters.sellerId);
  if (filters.brand) countQuery = countQuery.eq("brand", filters.brand);
  if (filters.model) countQuery = countQuery.eq("model", filters.model);
  if (filters.carTrim) countQuery = countQuery.eq("car_trim", filters.carTrim);
  if (filters.city) countQuery = countQuery.eq("city", filters.city);
  if (filters.district) countQuery = countQuery.eq("district", filters.district);
  if (filters.fuelType) countQuery = countQuery.eq("fuel_type", filters.fuelType);
  if (filters.transmission) countQuery = countQuery.eq("transmission", filters.transmission);
  if (filters.minPrice !== undefined) countQuery = countQuery.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) countQuery = countQuery.lte("price", filters.maxPrice);
  if (filters.minYear !== undefined) countQuery = countQuery.gte("year", filters.minYear);
  if (filters.maxYear !== undefined) countQuery = countQuery.lte("year", filters.maxYear);
  if (filters.maxMileage !== undefined) countQuery = countQuery.lte("mileage", filters.maxMileage);
  if (filters.maxTramer !== undefined) countQuery = countQuery.lte("tramer_amount", filters.maxTramer);
  if (filters.hasExpertReport === true) countQuery = countQuery.filter("expert_inspection->>hasInspection", "eq", "true");

  if (filters.query) {
    const terms = filters.query.trim().split(/\s+/).filter(Boolean);

    if (terms.length > 0) {
      const tsQuery = terms.map((t) => `${t}:*`).join(" & ");
      countQuery = countQuery.textSearch("search_vector", tsQuery);
    }
  }

  const { count: total } = await countQuery;
  const totalCount = total ?? 0;

  const result = {
    listings: listings ?? [],
    total: totalCount,
    page,
    limit,
    hasMore: page * limit < totalCount,
  };

  if (isDefaultView) {
    try {
      const { setCachedData } = await import("@/lib/redis/client");
      setCachedData(cacheKey, result, 600).catch((err) =>
        logger.db.warn("Redis cache set failed for listings", { cacheKey }, err)
      );
    } catch {
      // Ignored during build/edge
    }
  }

  return result;
}

export function mapListingImagesToDatabaseRows(listing: Listing) {
  return listing.images.map((image) => ({
    is_cover: image.isCover,
    listing_id: listing.id,
    public_url: image.url,
    sort_order: image.order,
    storage_path: image.storagePath,
    placeholder_blur: image.placeholderBlur ?? null,
  }));
}

interface CreateListingResult {
  listing?: Listing;
  error?: "slug_collision" | "database_error" | null;
}

export async function createDatabaseListing(listing: Listing): Promise<CreateListingResult> {
  if (!hasSupabaseAdminEnv()) {
    return { error: "database_error" };
  }

  const admin = createSupabaseAdminClient();
  const insertResult = await admin.from("listings").insert(mapListingToDatabaseRow(listing));

  if (insertResult.error) {
    if (insertResult.error.message.includes("slug_unique") || insertResult.error.code === "23505") {
      return { error: "slug_collision" };
    }
    return { error: "database_error" };
  }

  const imageRows = mapListingImagesToDatabaseRows(listing);

  if (imageRows.length > 0) {
    const imageInsertResult = await admin.from("listing_images").insert(imageRows);

    if (imageInsertResult.error) {
      await admin.from("listings").delete().eq("id", listing.id);
      return { error: "database_error" };
    }
  }

  const createdListing = (await getDatabaseListings({ listingId: listing.id }))?.[0];
  return { listing: createdListing };
}

interface UpdateListingResult {
  listing?: Listing | null;
  error?: "slug_collision" | "database_error" | null;
}

export async function updateDatabaseListing(listing: Listing): Promise<UpdateListingResult> {
  if (!hasSupabaseAdminEnv()) {
    return { error: "database_error" };
  }

  const admin = createSupabaseAdminClient();
  const previousListing = (await getDatabaseListings({ listingId: listing.id }))?.[0];
  const updateResult = await admin
    .from("listings")
    .update(mapListingToDatabaseRow(listing))
    .eq("id", listing.id);

  if (updateResult.error) {
    if (updateResult.error.message.includes("slug_unique") || updateResult.error.code === "23505") {
      return { error: "slug_collision" };
    }
    return { error: "database_error" };
  }

  const deleteImagesResult = await admin.from("listing_images").delete().eq("listing_id", listing.id);

  if (deleteImagesResult.error) {
    return { error: "database_error" };
  }

  const imageRows = mapListingImagesToDatabaseRows(listing);

  if (imageRows.length > 0) {
    const imageInsertResult = await admin.from("listing_images").insert(imageRows);

    if (imageInsertResult.error) {
      if (previousListing?.images.length) {
        const restoreResult = await admin
          .from("listing_images")
          .insert(mapListingImagesToDatabaseRows(previousListing));

        if (restoreResult.error) {
          logger.listings.error("updateDatabaseListing failed to restore previous images", restoreResult.error, {
            listingId: listing.id,
          });
        }
      }
      return { error: "database_error" };
    }
  }

  const updatedListing = (await getDatabaseListings({ listingId: listing.id }))?.[0];
  return { listing: updatedListing };
}

export function mapListingToDatabaseRow(listing: Listing) {
  return {
    brand: listing.brand,
    city: listing.city,
    created_at: listing.createdAt,
    damage_status_json: listing.damageStatusJson ?? null,
    description: listing.description,
    district: listing.district,
    expert_inspection: listing.expertInspection ?? null,
    featured: listing.featured,
    fraud_reason: listing.fraudReason ?? null,
    fraud_score: listing.fraudScore ?? 0,
    fuel_type: listing.fuelType,
    id: listing.id,
    mileage: listing.mileage,
    model: listing.model,
    price: listing.price,
    seller_id: listing.sellerId,
    slug: listing.slug,
    status: listing.status,
    title: listing.title,
    tramer_amount: listing.tramerAmount ?? null,
    transmission: listing.transmission,
    updated_at: listing.updatedAt,
    bumped_at: listing.bumpedAt ?? null,
    featured_until: listing.featuredUntil ?? null,
    urgent_until: listing.urgentUntil ?? null,
    highlighted_until: listing.highlightedUntil ?? null,
    eids_verification_json: listing.eidsVerificationJson ?? null,
    market_price_index: listing.marketPriceIndex ?? null,
    whatsapp_phone: listing.whatsappPhone,
    year: listing.year,
    vin: listing.vin ?? null,
    car_trim: listing.carTrim ?? null,
  };
}

export async function archiveDatabaseListing(listingId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({
      status: "archived" satisfies Listing["status"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    return null;
  }

  return (await getDatabaseListings({ listingId }))?.[0] ?? null;
}

export async function deleteDatabaseListing(listingId: string, sellerId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();

  // Verify listing exists and belongs to seller, and is archived
  const listing = (await getDatabaseListings({ listingId, sellerId }))?.[0];

  if (!listing || listing.status !== "archived") {
    return null;
  }

  // Delete images from storage
  if (listing.images.length > 0) {
    const storagePaths = listing.images
      .map((img) => img.storagePath)
      .filter((path) => path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      await admin.storage.from(bucketName).remove(storagePaths);
    }
  }

  // Delete listing_images rows
  await admin.from("listing_images").delete().eq("listing_id", listingId);

  // Delete related favorites
  await admin.from("favorites").delete().eq("listing_id", listingId);

  // Delete related reports
  await admin.from("reports").delete().eq("listing_id", listingId);

  // Delete the listing
  const { error } = await admin.from("listings").delete().eq("id", listingId);

  if (error) {
    return null;
  }

  return { id: listingId, deleted: true };
}

export async function adminDeleteDatabaseListing(listingId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();

  const listing = (await getDatabaseListings({ listingId }))?.[0];

  if (!listing) {
    return null;
  }

  // Delete images from storage
  if (listing.images.length > 0) {
    const storagePaths = listing.images
      .map((img) => img.storagePath)
      .filter((path) => path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      await admin.storage.from(bucketName).remove(storagePaths);
    }
  }

  await admin.from("listing_images").delete().eq("listing_id", listingId);
  await admin.from("favorites").delete().eq("listing_id", listingId);
  await admin.from("reports").delete().eq("listing_id", listingId);

  const { error } = await admin.from("listings").delete().eq("id", listingId);

  if (error) {
    return null;
  }

  return { id: listingId, deleted: true };
}

export async function moderateDatabaseListing(
  listingId: string,
  status: Extract<Listing["status"], "approved" | "rejected">,
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("listings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return null;
  }

  return (await getDatabaseListings({ listingId }))?.[0] ?? null;
}

export function parseStoredListings(rawValue?: string | null) {
  if (!rawValue) {
    return [] satisfies Listing[];
  }

  try {
    const parsed = JSON.parse(rawValue);
    const result = listingSchema.array().safeParse(parsed);

    if (!result.success) {
      return [] satisfies Listing[];
    }

    return result.data;
  } catch {
    return [] satisfies Listing[];
  }
}

export function serializeStoredListings(listings: Listing[]) {
  return JSON.stringify(listings);
}

/** @deprecated Only used by legacy-sync migration endpoint and edit/archive fallback. */
export async function getLegacyStoredListings() {
  const cookieStore = await cookies();

  return parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export function buildPendingListing(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: Listing[],
) {
  return buildListingRecord(input, sellerId, existingListings, {
    status: "pending",
  });
}

export function buildUpdatedListing(
  input: ListingCreateInput,
  existingListing: Listing,
  existingListings: Listing[],
) {
  return buildListingRecord(input, existingListing.sellerId, existingListings, {
    existingListing,
  });
}

export function replaceStoredListing(existingListings: Listing[], nextListing: Listing) {
  const alreadyExists = existingListings.some((listing) => listing.id === nextListing.id);

  if (!alreadyExists) {
    return [nextListing, ...existingListings];
  }

  return existingListings.map((listing) => (listing.id === nextListing.id ? nextListing : listing));
}

export function archiveStoredListing(existingListing: Listing) {
  return listingSchema.parse({
    ...existingListing,
    status: "archived",
    updatedAt: new Date().toISOString(),
  });
}

export function moderateStoredListing(
  existingListing: Listing,
  status: Extract<Listing["status"], "approved" | "rejected">,
) {
  return listingSchema.parse({
    ...existingListing,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export function getEditableListingById(listings: Listing[], listingId: string, sellerId: string) {
  return listings.find(
    (listing) =>
      listing.id === listingId &&
      listing.sellerId === sellerId &&
      (listing.status === "draft" || listing.status === "pending"),
  );
}

export function getArchivableListingById(listings: Listing[], listingId: string, sellerId: string) {
  return listings.find(
    (listing) =>
      listing.id === listingId &&
      listing.sellerId === sellerId &&
      listing.status !== "archived",
  );
}

export async function findEditableListingById(listingId: string, sellerId: string) {
  const dbListings = await getDatabaseListings({
    listingId,
    sellerId,
    statuses: ["draft", "pending", "approved", "rejected"],
  });

  if (dbListings && dbListings.length > 0) {
    return dbListings[0];
  }

  const cookieListings = await getLegacyStoredListings();
  return getEditableListingById(cookieListings, listingId, sellerId) ?? null;
}

export async function findArchivableListingById(listingId: string, sellerId: string) {
  const dbListings = await getDatabaseListings({
    listingId,
    sellerId,
  });

  if (dbListings && dbListings.length > 0) {
    const listing = dbListings[0];
    if (listing.status !== "archived") {
      return listing;
    }
    return null;
  }

  const cookieListings = await getLegacyStoredListings();
  return getArchivableListingById(cookieListings, listingId, sellerId) ?? null;
}

export function getModeratableListingById(listings: Listing[], listingId: string) {
  return listings.find((listing) => listing.id === listingId && listing.status === "pending");
}

export async function getStoredListings() {
  const databaseListings = await getDatabaseListings();
  return (databaseListings ?? []).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export async function getStoredUserListings(sellerId: string) {
  const databaseListings = await getDatabaseListings({ sellerId });
  return (databaseListings ?? []).sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export async function getStoredListingBySlug(slug: string) {
  const databaseListings = await getDatabaseListings({ slug });
  return databaseListings?.[0] ?? null;
}

export async function checkListingExistsById(listingId: string) {
  const databaseListings = await getDatabaseListings({ ids: [listingId] });
  return databaseListings && databaseListings.length > 0;
}

export async function getStoredListingById(listingId: string) {
  const databaseListings = await getDatabaseListings({ ids: [listingId] });
  return databaseListings?.[0] ?? null;
}

export async function getStoredListingsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const databaseListings = await getDatabaseListings({ ids });
  return databaseListings ?? [];
}

/** @deprecated Only used by legacy-sync migration endpoint. */
export async function getLegacyStoredUserListings(sellerId: string) {
  return (await getLegacyStoredListings()).filter((listing) => listing.sellerId === sellerId);
}

export async function upsertDatabaseListingRecord(listing: Listing) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const updatedListing = await updateDatabaseListing(listing);

  if (updatedListing) {
    return updatedListing;
  }

  return createDatabaseListing(listing);
}
