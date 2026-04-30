import { logger } from "@/lib/logging/logger";
import { sanitizeDescription } from "@/lib/sanitization/sanitize";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Listing } from "@/types";

import { listingSelect } from "./listing-submission-query";
import { ListingRow, mapListingRow } from "./mappers/listing-row.mapper";

type ListingPersistenceError =
  | "concurrent_update_detected"
  | "configuration_error"
  | "database_error"
  | "image_persistence_error"
  | "slug_collision";

type ListingPersistenceResult =
  | { listing: Listing; error?: undefined }
  | { listing?: undefined; error: ListingPersistenceError };

function classifyPersistenceError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return "database_error" as const;
  if (error.code === "PGRST116") return "concurrent_update_detected" as const;
  if (error.message?.includes("slug_unique") || error.code === "23505") {
    return "slug_collision" as const;
  }
  return "database_error" as const;
}

export function mapListingToDatabaseRow(listing: Listing) {
  return {
    id: listing.id,
    seller_id: listing.sellerId,
    slug: listing.slug,
    title: listing.title,
    category: listing.category,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    fuel_type: listing.fuelType,
    transmission: listing.transmission,
    price: Math.round(listing.price * 100), // PILL: Store as kurus (bigint) for precision
    city: listing.city,
    district: listing.district,
    description: sanitizeDescription(listing.description),
    whatsapp_phone: listing.whatsappPhone,
    license_plate: listing.licensePlate ?? null,
    status: listing.status,
    featured: listing.featured,
    updated_at: listing.updatedAt,
    tramer_amount: listing.tramerAmount ?? null,
    damage_status_json:
      listing.damageStatusJson && Object.keys(listing.damageStatusJson).length > 0
        ? listing.damageStatusJson
        : null,
    fraud_score: listing.fraudScore ?? 0,
    fraud_reason: listing.fraudReason ?? null,
    featured_until: listing.featuredUntil ?? null,
    urgent_until: listing.urgentUntil ?? null,
    highlighted_until: listing.highlightedUntil ?? null,
    market_price_index: listing.marketPriceIndex ?? null,
    vin: listing.vin ?? null,
    bumped_at: listing.bumpedAt ?? null,
    car_trim: listing.carTrim ?? null,
    expert_inspection: listing.expertInspection ?? null,
    // PILL: Issue C-5 - Pass current version, don't increment here.
    // The increment is handled by the database RPCs.
    version: listing.version ?? 0,
  };
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

/**
 * Creates a listing in the database with automatic slug collision retry.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Uses .insert().select() to return data in ONE query (no roundtrip)
 * - Eliminates getDatabaseListings() call after insert
 * - Reduces latency by ~50-100ms per listing creation
 *
 * If a slug collision occurs (unique constraint violation), automatically
 * generates a new slug with a numeric suffix and retries up to 3 times.
 *
 * @param listing - Listing to create
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result with created listing or error
 */
export async function createDatabaseListing(
  listing: Listing,
  maxRetries: number = 3
): Promise<ListingPersistenceResult> {
  const supabase = await createSupabaseServerClient();
  let currentListing = listing;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // PILL: Issue C-4 / H-3 - Atomic creation & quota check via RPC
    const imagesToUpsert = currentListing.images.map((img) => ({
      storage_path: img.storagePath,
      public_url: img.url,
      is_cover: img.isCover,
      sort_order: img.order,
      placeholder_blur: img.placeholderBlur ?? null,
    }));

    const { data: createdListingRow, error: rpcError } = await supabase.rpc(
      "create_listing_with_images",
      {
        p_listing_data: mapListingToDatabaseRow(currentListing),
        p_images_to_upsert: imagesToUpsert,
      }
    );

    if (rpcError) {
      if (rpcError.message === "quota_exceeded") {
        return { error: "database_error" as const };
      }

      const classifiedError = classifyPersistenceError(rpcError);
      if (classifiedError === "slug_collision" && attempt < maxRetries - 1) {
        const baseSlug = currentListing.slug.replace(/-\d+$/, "");
        const newSlug = `${baseSlug}-${attempt + 2}`;
        currentListing = { ...currentListing, slug: newSlug };
        continue;
      }
      return { error: classifiedError };
    }

    const listingRow = createdListingRow as ListingRow;
    const createdListing: Listing = {
      ...mapListingRow(listingRow),
      images: currentListing.images, // Keep rich image objects if needed, or trust mapListingRow
    };

    return { listing: createdListing };
  }

  // Should never reach here, but just in case
  return { error: "slug_collision" as const };
}

/**
 * Updates a listing in the database.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Uses .update().select() to return data in ONE query (no roundtrip)
 * - Eliminates getDatabaseListings() calls before/after update
 * - Reduces latency by ~100-200ms per listing update
 */
export async function updateDatabaseListing(listing: Listing): Promise<ListingPersistenceResult> {
  const supabase = await createSupabaseServerClient();

  // 1. Identify orphaned images before updating DB (to handle physical storage cleanup later)
  const { data: oldImages } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listing.id);

  const oldPaths = (oldImages ?? []).map((img) => img.storage_path).filter(Boolean);
  const newPaths = listing.images.map((img) => img.storagePath).filter(Boolean);
  const pathsToDelete = oldPaths.filter((path) => !newPaths.includes(path));

  // 2. Prepare RPC payload
  const listingData = {
    ...mapListingToDatabaseRow(listing),
    old_version: listing.version ?? 0, // Used for OCC check in RPC
  };

  const imagesToUpsert = listing.images.map((img) => ({
    storage_path: img.storagePath,
    public_url: img.url,
    is_cover: img.isCover,
    sort_order: img.order,
    placeholder_blur: img.placeholderBlur ?? null,
  }));

  // 3. Execute Consolidated RPC
  // PERFORMANCE FIX: Issue PERF-05 - Consolidate round-trips into 1 RPC
  const { data: updatedData, error: rpcError } = await supabase.rpc("upsert_listing_with_images", {
    p_listing_data: listingData,
    p_images_to_delete: pathsToDelete,
    p_images_to_upsert: imagesToUpsert,
  });

  if (rpcError) {
    if (rpcError.message?.includes("concurrent_update_detected")) {
      return { error: "concurrent_update_detected" as const };
    }
    logger.db.error("Consolidated listing update failed", rpcError, {
      listingId: listing.id,
    });
    return { error: classifyPersistenceError(rpcError) };
  }

  // 4. Physical Storage Cleanup (Async Queue) - Non-blocking
  if (pathsToDelete.length > 0) {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
    import("@/lib/storage/registry").then(({ queueFileCleanup }) => {
      queueFileCleanup(bucketName, pathsToDelete).catch((err) =>
        logger.db.error("Failed to queue orphaned images for cleanup", err)
      );
    });
  }

  // Map result back to Domain Model
  return { listing: mapListingRow(updatedData as unknown as ListingRow) };
}

/**
 * Archives a listing by updating its status and incrementing its version.
 */
export async function archiveListing(
  listingId: string,
  sellerId: string
): Promise<ListingPersistenceResult> {
  const supabase = await createSupabaseServerClient();

  // PERFORMANCE OPTIMIZATION: Fetch current version first for atomic-like update without .raw()
  const { data: current, error: fetchError } = await supabase
    .from("listings")
    .select("version")
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .single();

  if (fetchError) return { error: "database_error" as const };

  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "archived" satisfies Listing["status"],
      updated_at: new Date().toISOString(),
      version: (current?.version ?? 0) + 1,
    })
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .eq("version", current?.version ?? 0)
    .select(listingSelect)
    .single();

  if (error) {
    return { error: classifyPersistenceError(error) };
  }

  return { listing: mapListingRow(data as unknown as ListingRow) };
}

/**
 * Deletes a listing and its associated data (images, favorites, reports) atomically.
 * Uses RPC function for atomic transaction to prevent partial deletes.
 * Physical storage cleanup should be handled by the caller or a side-effect.
 */
export async function deleteListing(
  listingId: string,
  version: number
): Promise<{ success: boolean; error?: ListingPersistenceError }> {
  const supabase = await createSupabaseServerClient();

  // Use atomic RPC function for transactional delete
  const { error } = await supabase.rpc("delete_listing_atomic", {
    p_listing_id: listingId,
    p_version: version,
  });

  if (error) {
    // Check if it's a concurrent update (version mismatch)
    if (error.message?.includes("concurrent_update_detected")) {
      return { success: false, error: "concurrent_update_detected" as const };
    }
    return { success: false, error: classifyPersistenceError(error) };
  }

  return { success: true };
}

/**
 * Bumps a listing by updating its bumped_at timestamp.
 */
export async function bumpListing(
  listingId: string,
  sellerId: string
): Promise<ListingPersistenceResult> {
  const supabase = await createSupabaseServerClient();

  // PERFORMANCE OPTIMIZATION: Fetch current version first for atomic-like update without .raw()
  const { data: current, error: fetchError } = await supabase
    .from("listings")
    .select("version")
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .single();

  if (fetchError) return { error: "database_error" as const };

  const { data, error } = await supabase
    .from("listings")
    .update({
      bumped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: (current?.version ?? 0) + 1,
    })
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .eq("version", current?.version ?? 0)
    .select(listingSelect)
    .single();

  if (error) {
    return { error: classifyPersistenceError(error) };
  }

  return { listing: mapListingRow(data as unknown as ListingRow) };
}

/**
 * Publishes a listing by updating its status.
 * If archived, moves to approved (as per machine).
 */
export async function publishListing(
  listingId: string,
  sellerId: string
): Promise<ListingPersistenceResult> {
  const supabase = await createSupabaseServerClient();

  // 1. Get current status to determine next status if needed
  // (In our machine, archived -> approved)
  let current;
  try {
    const { data, error: fetchError } = await supabase
      .from("listings")
      .select("status, version")
      .eq("id", listingId)
      .eq("seller_id", sellerId)
      .single();

    if (fetchError) throw fetchError;
    current = data;
  } catch {
    return { error: "database_error" as const };
  }

  if (!current) return { error: "database_error" as const };

  const nextStatus: Listing["status"] = current.status === "archived" ? "approved" : "pending";

  let updateResult;
  try {
    updateResult = await supabase
      .from("listings")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        version: (current.version ?? 0) + 1,
      })
      .eq("id", listingId)
      .eq("seller_id", sellerId)
      .eq("version", current.version ?? 0)
      .select("id, seller_id, slug, title, status, version, updated_at, published_at")
      .single();
  } catch (err) {
    updateResult = { data: null, error: err as { code?: string; message?: string } };
  }
  const { error, data: updated } = updateResult;

  if (error) {
    return { error: classifyPersistenceError(error) };
  }

  return { listing: mapListingRow(updated as unknown as ListingRow) };
}
