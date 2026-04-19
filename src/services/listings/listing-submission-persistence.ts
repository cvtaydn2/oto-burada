import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { Listing } from "@/types";
import { getDatabaseListings } from "./listing-submission-query";

export function mapListingToDatabaseRow(listing: Listing) {
  return {
    id: listing.id,
    seller_id: listing.sellerId,
    slug: listing.slug,
    title: listing.title,
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    fuel_type: listing.fuelType,
    transmission: listing.transmission,
    price: listing.price,
    city: listing.city,
    district: listing.district,
    description: listing.description,
    whatsapp_phone: listing.whatsappPhone,
    license_plate: listing.licensePlate ?? null,
    status: listing.status,
    featured: listing.featured,
    updated_at: listing.updatedAt,
    tramer_amount: listing.tramerAmount ?? null,
    damage_status_json: listing.damageStatusJson && Object.keys(listing.damageStatusJson).length > 0
      ? Object.fromEntries(
          Object.entries(listing.damageStatusJson)
            .map(([k, v]) => [k, v === "orjinal" ? "orijinal" : v])
            .filter(([, v]) => ["orijinal", "boyali", "lokal_boyali", "degisen", "hasarli", "belirtilmemis", "bilinmiyor"].includes(v as string))
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

export async function createDatabaseListing(listing: Listing) {
  if (!hasSupabaseAdminEnv()) return { error: "database_error" as const };
  const admin = createSupabaseAdminClient();
  const insertResult = await admin.from("listings").insert(mapListingToDatabaseRow(listing));

  if (insertResult.error) {
    if (insertResult.error.message.includes("slug_unique") || insertResult.error.code === "23505") {
      return { error: "slug_collision" as const };
    }
    return { error: "database_error" as const };
  }

  const imageRows = mapListingImagesToDatabaseRows(listing);
  if (imageRows.length > 0) {
    const imageInsertResult = await admin.from("listing_images").insert(imageRows);
    if (imageInsertResult.error) {
      await admin.from("listings").delete().eq("id", listing.id);
      return { error: "database_error" as const };
    }
  }

  const createdListing = (await getDatabaseListings({ listingId: listing.id }))?.[0];
  return { listing: createdListing };
}

export async function updateDatabaseListing(listing: Listing) {
  if (!hasSupabaseAdminEnv()) return { error: "database_error" as const };
  const admin = createSupabaseAdminClient();
  const previousListing = (await getDatabaseListings({ listingId: listing.id }))?.[0];
  
  const updateResult = await admin
    .from("listings")
    .update(mapListingToDatabaseRow(listing))
    .eq("id", listing.id);

  if (updateResult.error) {
    if (updateResult.error.message.includes("slug_unique") || updateResult.error.code === "23505") {
      return { error: "slug_collision" as const };
    }
    return { error: "database_error" as const };
  }

  await admin.from("listing_images").delete().eq("listing_id", listing.id);
  const imageRows = mapListingImagesToDatabaseRows(listing);
  if (imageRows.length > 0) {
    const imageInsertResult = await admin.from("listing_images").insert(imageRows);
    if (imageInsertResult.error && previousListing) {
      await admin.from("listing_images").insert(mapListingImagesToDatabaseRows(previousListing));
      return { error: "database_error" as const };
    }
  }

  const updatedListing = (await getDatabaseListings({ listingId: listing.id }))?.[0];
  return { listing: updatedListing };
}
