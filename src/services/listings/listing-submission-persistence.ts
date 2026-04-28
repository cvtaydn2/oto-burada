import { logger } from "@/lib/logging/logger";
import { sanitizeDescription } from "@/lib/sanitization/sanitize";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { Listing } from "@/types";

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
    price: listing.price,
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
        ? Object.fromEntries(
            Object.entries(listing.damageStatusJson)
              .map(([k, v]) => [k, v === "orjinal" ? "orijinal" : v])
              .filter(([, v]) =>
                [
                  "orijinal",
                  "boyali",
                  "lokal_boyali",
                  "degisen",
                  "hasarli",
                  "belirtilmemis",
                  "bilinmiyor",
                ].includes(v as string)
              )
          )
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
    // ── PILL: Issue 5 - OCC Increment ──────────
    // We increment version on every database level update.
    version: (listing.version ?? 0) + 1,
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
  if (!hasSupabaseAdminEnv()) return { error: "configuration_error" as const };

  const admin = createSupabaseAdminClient();
  let currentListing = listing;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // OPTIMIZATION: Use .select() to return inserted data in same query
    let insertResult;
    try {
      insertResult = await admin
        .from("listings")
        .insert(mapListingToDatabaseRow(currentListing))
        .select(
          `
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
          market_price_index,
          expert_inspection,
          published_at,
          bumped_at,
          view_count,
          version,
          created_at,
          updated_at
        `
        )
        .single();
    } catch (err) {
      insertResult = { data: null, error: err as { code?: string; message?: string } };
    }

    if (insertResult.error) {
      // Check for unique constraint violation (slug collision)
      const classifiedError = classifyPersistenceError(insertResult.error);
      const isSlugCollision = classifiedError === "slug_collision";

      if (isSlugCollision && attempt < maxRetries - 1) {
        // Generate new slug with suffix and retry
        const baseSlug = listing.slug.replace(/-\d+$/, ""); // Remove existing suffix
        const newSlug = `${baseSlug}-${attempt + 2}`; // Start from -2, -3, etc.

        currentListing = {
          ...currentListing,
          slug: newSlug,
        };

        continue; // Retry with new slug
      }

      // Max retries reached or other error
      if (isSlugCollision) {
        return { error: "slug_collision" as const };
      }
      return { error: classifiedError };
    }

    // Listing inserted successfully, now insert images
    const imageRows = mapListingImagesToDatabaseRows(currentListing);
    if (imageRows.length > 0) {
      const imageInsertResult = await admin.from("listing_images").insert(imageRows);
      if (imageInsertResult.error) {
        // Rollback: delete the listing row
        await admin.from("listings").delete().eq("id", currentListing.id);

        // Compensating cleanup: queue storage files and registry entries for removal
        // so uploaded files don't become orphans.
        const storagePaths = currentListing.images
          .map((img) => img.storagePath)
          .filter((p) => p.length > 0);
        if (storagePaths.length > 0) {
          const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
          const { queueFileCleanup } = await import("@/lib/storage/registry");
          await queueFileCleanup(bucketName, storagePaths);
        }

        return { error: "image_persistence_error" as const };
      }
    }

    // OPTIMIZATION: Construct listing from insert result + images (no extra fetch)
    const createdListing: Listing = {
      id: insertResult.data.id,
      sellerId: insertResult.data.seller_id,
      slug: insertResult.data.slug,
      title: insertResult.data.title,
      category: insertResult.data.category ?? "otomobil",
      brand: insertResult.data.brand,
      model: insertResult.data.model,
      year: insertResult.data.year,
      mileage: insertResult.data.mileage,
      fuelType: insertResult.data.fuel_type,
      transmission: insertResult.data.transmission,
      price: Number(insertResult.data.price),
      city: insertResult.data.city,
      district: insertResult.data.district,
      description: insertResult.data.description,
      whatsappPhone: insertResult.data.whatsapp_phone,
      licensePlate: insertResult.data.license_plate ?? null,
      vin: insertResult.data.vin ?? null,
      carTrim: insertResult.data.car_trim ?? null,
      tramerAmount:
        insertResult.data.tramer_amount != null ? Number(insertResult.data.tramer_amount) : null,
      damageStatusJson:
        (insertResult.data.damage_status_json as Record<string, string> | null) ?? null,
      fraudScore: insertResult.data.fraud_score ?? 0,
      fraudReason: insertResult.data.fraud_reason ?? null,
      status: insertResult.data.status,
      featured: insertResult.data.featured,
      featuredUntil: insertResult.data.featured_until ?? null,
      urgentUntil: insertResult.data.urgent_until ?? null,
      highlightedUntil: insertResult.data.highlighted_until ?? null,
      marketPriceIndex: insertResult.data.market_price_index
        ? Number(insertResult.data.market_price_index)
        : null,
      expertInspection: insertResult.data.expert_inspection ?? undefined,
      bumpedAt: insertResult.data.bumped_at ?? null,
      viewCount: insertResult.data.view_count ?? 0,
      version: insertResult.data.version ?? 0,
      createdAt: insertResult.data.created_at,
      updatedAt: insertResult.data.updated_at,
      images: currentListing.images, // Use the images we just inserted
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
export async function updateDatabaseListing(listing: Listing) {
  if (!hasSupabaseAdminEnv()) return { error: "configuration_error" as const };
  const admin = createSupabaseAdminClient();
  const listingsTable = admin.from("listings");
  const updateQuery = listingsTable.update(mapListingToDatabaseRow(listing));
  const filteredUpdateQuery =
    "match" in updateQuery && typeof updateQuery.match === "function"
      ? updateQuery.match({ id: listing.id, version: listing.version ?? 0 })
      : updateQuery.eq("id", listing.id).eq("version", listing.version ?? 0);

  // OPTIMIZATION: Use .select() to return updated data in same query
  let updateResult;
  try {
    updateResult = await filteredUpdateQuery
      .select(
        `
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
        market_price_index,
        expert_inspection,
        published_at,
        bumped_at,
        view_count,
        version,
        created_at,
        updated_at
      `
      )
      .single();
  } catch (err) {
    updateResult = { data: null, error: err as { code?: string; message?: string } };
  }

  if (updateResult.error) {
    return { error: classifyPersistenceError(updateResult.error) };
  }

  // Check if zero rows were updated (meaning version mismatch)
  if (!updateResult.data) {
    return { error: "concurrent_update_detected" as const };
  }

  // 1. Identify orphaned images before updating DB
  const { data: oldImages } = await admin
    .from("listing_images")
    .select("storage_path, is_cover, sort_order, public_url, placeholder_blur")
    .eq("listing_id", listing.id);

  const oldPaths = (oldImages ?? []).map((img) => img.storage_path).filter(Boolean);
  const newPaths = listing.images.map((img) => img.storagePath).filter(Boolean);
  const pathsToDelete = oldPaths.filter((path) => !newPaths.includes(path));

  // 2. Update DB images using upsert pattern to minimize data loss window
  // Instead of delete-all + insert-all, we:
  // 1. Identify images to delete (not in new set)
  // 2. Delete only those specific images
  // 3. Upsert new images (insert or update)

  const newPathSet = new Set(listing.images.map((img) => img.storagePath));
  const imagesToDelete = (oldImages ?? []).filter((img) => !newPathSet.has(img.storage_path));

  // Delete only orphaned images
  if (imagesToDelete.length > 0) {
    const pathsToDeleteNow = imagesToDelete.map((img) => img.storage_path);
    await admin.from("listing_images").delete().in("storage_path", pathsToDeleteNow);
  }

  // Upsert new/updated images (insert or update based on storage_path)
  const imageRows = mapListingImagesToDatabaseRows(listing);
  if (imageRows.length > 0) {
    const imageUpsertResult = await admin.from("listing_images").upsert(imageRows, {
      onConflict: "listing_id,storage_path",
      ignoreDuplicates: false,
    });

    if (imageUpsertResult.error) {
      logger.db.error("Image upsert failed during listing update", imageUpsertResult.error, {
        listingId: listing.id,
      });
      return { error: "image_persistence_error" as const };
    }
  }

  // 3. Physical Storage Cleanup (Async Queue)
  if (pathsToDelete.length > 0) {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
    const { queueFileCleanup } = await import("@/lib/storage/registry");
    await queueFileCleanup(bucketName, pathsToDelete);
  }

  // OPTIMIZATION: Construct listing from update result + images (no extra fetch)
  const updatedListing: Listing = {
    id: updateResult.data.id,
    sellerId: updateResult.data.seller_id,
    slug: updateResult.data.slug,
    title: updateResult.data.title,
    category: updateResult.data.category ?? "otomobil",
    brand: updateResult.data.brand,
    model: updateResult.data.model,
    year: updateResult.data.year,
    mileage: updateResult.data.mileage,
    fuelType: updateResult.data.fuel_type,
    transmission: updateResult.data.transmission,
    price: Number(updateResult.data.price),
    city: updateResult.data.city,
    district: updateResult.data.district,
    description: updateResult.data.description,
    whatsappPhone: updateResult.data.whatsapp_phone,
    licensePlate: updateResult.data.license_plate ?? null,
    vin: updateResult.data.vin ?? null,
    carTrim: updateResult.data.car_trim ?? null,
    tramerAmount:
      updateResult.data.tramer_amount != null ? Number(updateResult.data.tramer_amount) : null,
    damageStatusJson:
      (updateResult.data.damage_status_json as Record<string, string> | null) ?? null,
    fraudScore: updateResult.data.fraud_score ?? 0,
    fraudReason: updateResult.data.fraud_reason ?? null,
    status: updateResult.data.status,
    featured: updateResult.data.featured,
    featuredUntil: updateResult.data.featured_until ?? null,
    urgentUntil: updateResult.data.urgent_until ?? null,
    highlightedUntil: updateResult.data.highlighted_until ?? null,
    marketPriceIndex: updateResult.data.market_price_index
      ? Number(updateResult.data.market_price_index)
      : null,
    expertInspection: updateResult.data.expert_inspection ?? undefined,
    bumpedAt: updateResult.data.bumped_at ?? null,
    viewCount: updateResult.data.view_count ?? 0,
    version: updateResult.data.version ?? 0,
    createdAt: updateResult.data.created_at,
    updatedAt: updateResult.data.updated_at,
    images: listing.images, // Use the images we just inserted
  };

  return { listing: updatedListing };
}

/**
 * Archives a listing by updating its status and incrementing its version.
 */
export async function archiveListing(
  listingId: string,
  sellerId: string
): Promise<ListingPersistenceResult> {
  if (!hasSupabaseAdminEnv()) return { error: "configuration_error" as const };
  const admin = createSupabaseAdminClient();

  // OCC: We need current version to perform safe update
  let current;
  try {
    const { data, error: fetchError } = await admin
      .from("listings")
      .select("version, status")
      .eq("id", listingId)
      .eq("seller_id", sellerId)
      .single();

    if (fetchError) throw fetchError;
    current = data;
  } catch {
    return { error: "database_error" as const };
  }

  if (!current) return { error: "database_error" as const };

  let updateResult;
  try {
    updateResult = await admin
      .from("listings")
      .update({
        status: "archived" satisfies Listing["status"],
        updated_at: new Date().toISOString(),
        version: (current.version ?? 0) + 1,
      })
      .eq("id", listingId)
      .eq("seller_id", sellerId)
      .eq("version", current.version ?? 0)
      .select("id, seller_id, slug, title, status, version, updated_at")
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

/**
 * Deletes a listing and its associated data (images, favorites, reports) atomically.
 * Uses RPC function for atomic transaction to prevent partial deletes.
 * Physical storage cleanup should be handled by the caller or a side-effect.
 */
export async function deleteListing(
  listingId: string,
  version: number
): Promise<{ success: boolean; error?: ListingPersistenceError }> {
  if (!hasSupabaseAdminEnv()) return { success: false, error: "configuration_error" as const };
  const admin = createSupabaseAdminClient();

  // Use atomic RPC function for transactional delete
  const { error } = await admin.rpc("delete_listing_atomic", {
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
  if (!hasSupabaseAdminEnv()) return { error: "configuration_error" as const };
  const admin = createSupabaseAdminClient();

  let current;
  try {
    const { data, error: fetchError } = await admin
      .from("listings")
      .select("version")
      .eq("id", listingId)
      .eq("seller_id", sellerId)
      .single();

    if (fetchError) throw fetchError;
    current = data;
  } catch {
    return { error: "database_error" as const };
  }

  if (!current) return { error: "database_error" as const };

  let updateResult;
  try {
    updateResult = await admin
      .from("listings")
      .update({
        bumped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: (current.version ?? 0) + 1,
      })
      .eq("id", listingId)
      .eq("seller_id", sellerId)
      .eq("version", current.version ?? 0)
      .select("id, seller_id, slug, title, status, version, updated_at, bumped_at")
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

/**
 * Publishes a listing by updating its status.
 * If archived, moves to approved (as per machine).
 */
export async function publishListing(
  listingId: string,
  sellerId: string
): Promise<ListingPersistenceResult> {
  if (!hasSupabaseAdminEnv()) return { error: "configuration_error" as const };
  const admin = createSupabaseAdminClient();

  // 1. Get current status to determine next status if needed
  // (In our machine, archived -> approved)
  let current;
  try {
    const { data, error: fetchError } = await admin
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
    updateResult = await admin
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
