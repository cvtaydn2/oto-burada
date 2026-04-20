import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { listingSchema } from "@/lib/validators";
import type { Listing, ListingCreateInput } from "@/types";
import { listingSubmissionsCookieName } from "./constants";

// Feature Modules
import { buildListingSlug } from "./listing-submission-helpers";
import { calculateFraudScore } from "./listing-submission-moderation";

export { buildListingSlug, calculateFraudScore };
import { 
  getDatabaseListings, 
  getFilteredDatabaseListings, 
  PaginatedListingsResult 
} from "./listing-submission-query";
import { 
  createDatabaseListing, 
  updateDatabaseListing, 
  mapListingToDatabaseRow,
  mapListingImagesToDatabaseRows
} from "./listing-submission-persistence";
import { ListingRow, ListingImageRow } from "./listing-submission-types";

// Re-export types for backward compatibility
export type { ListingRow, ListingImageRow };

/** Orchestrates the creation of a listing record with all computed fields (slug, fraud score). */
export function buildListingRecord(
  input: ListingCreateInput,
  sellerId: string,
  existingListings: { id: string; slug: string }[],
  options?: {
    existingListing?: Listing;
    id?: string;
    status?: Listing["status"];
  },
) {
  const existingListing = options?.existingListing;
  const id = existingListing?.id ?? options?.id ?? crypto.randomUUID();
  
  // Delegate slug and fraud calculation to specialized modules
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
    licensePlate: input.licensePlate ?? null,
    tramerAmount: input.tramerAmount ?? null,
    damageStatusJson: input.damageStatusJson ?? null,
    fraudScore: fraudAssessment.fraudScore,
    fraudReason: fraudAssessment.fraudReason,
    status: options?.status ?? fraudAssessment.suggestedStatus ?? existingListing?.status ?? "pending_ai_review",
    featured: existingListing?.featured ?? false,
    expertInspection: input.expertInspection,
    bumpedAt: existingListing?.bumpedAt ?? null,
    featuredUntil: existingListing?.featuredUntil ?? null,
    urgentUntil: existingListing?.urgentUntil ?? null,
    highlightedUntil: existingListing?.highlightedUntil ?? null,
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

// Proxy exports for query logic
export { getDatabaseListings, getFilteredDatabaseListings };
export type { PaginatedListingsResult };

export async function archiveDatabaseListing(listingId: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({
      status: "archived" satisfies Listing["status"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) return null;
  return (await getDatabaseListings({ listingId }))?.[0] ?? null;
}

export async function deleteDatabaseListing(listingId: string, sellerId: string) {
  if (!hasSupabaseAdminEnv()) return null;
  const admin = createSupabaseAdminClient();
  
  // Fetch the listing to verify ownership and status
  const listing = (await getDatabaseListings({ listingId, sellerId }))?.[0];
  
  // Rule: Can delete anything EXCEPT 'approved' (must be archived/rejected/draft first)
  if (!listing || listing.status === "approved") {
    return null;
  }

  // Handle storage cleanup
  if (listing.images.length > 0) {
    const storagePaths = listing.images.map((img) => img.storagePath).filter((path) => path.length > 0);
    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      await admin.storage.from(bucketName).remove(storagePaths);
    }
  }

  await admin.from("listing_images").delete().eq("listing_id", listingId);
  await admin.from("favorites").delete().eq("listing_id", listingId);
  await admin.from("reports").delete().eq("listing_id", listingId);
  const { error } = await admin.from("listings").delete().eq("id", listingId);

  return error ? null : { id: listingId, deleted: true };
}

// Cookie & Draft Logic
export function parseStoredListings(rawValue?: string | null) {
  if (!rawValue) return [] satisfies Listing[];
  try {
    const parsed = JSON.parse(rawValue);
    const result = listingSchema.array().safeParse(parsed);
    return result.success ? result.data : [];
  } catch { return []; }
}

export function serializeStoredListings(listings: Listing[]) {
  return JSON.stringify(listings);
}

export async function getLegacyStoredListings() {
  const cookieStore = await cookies();
  return parseStoredListings(cookieStore.get(listingSubmissionsCookieName)?.value).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

// Orchestration Helpers
export function buildPendingListing(input: ListingCreateInput, sellerId: string, existingListings: { id: string; slug: string }[]) {
  return buildListingRecord(input, sellerId, existingListings, { status: "pending" });
}

export function buildUpdatedListing(input: ListingCreateInput, existingListing: Listing, existingListings: { id: string; slug: string }[]) {
  const nextStatus = existingListing.status === "draft" || existingListing.status === "pending" ? existingListing.status : "pending";
  return buildListingRecord(input, existingListing.sellerId, existingListings, { existingListing, status: nextStatus });
}

export async function findEditableListingById(listingId: string, sellerId: string) {
  const dbListings = await getDatabaseListings({ listingId, sellerId, statuses: ["draft", "pending", "approved", "rejected"] });
  if (dbListings?.length) return dbListings[0];
  const cookieListings = await getLegacyStoredListings();
  return cookieListings.find(l => l.id === listingId && l.sellerId === sellerId && (l.status === "draft" || l.status === "pending")) ?? null;
}

export async function getStoredUserListings(sellerId: string) {
  const databaseListings = await getDatabaseListings({ sellerId });
  return (databaseListings ?? []).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function getExistingListingSlugs(): Promise<{ id: string; slug: string }[]> {
  if (!hasSupabaseAdminEnv()) return [];
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("listings").select("id, slug").neq("status", "archived");
  return (data ?? []) as { id: string; slug: string }[];
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
  if (ids.length === 0) return [];
  const databaseListings = await getDatabaseListings({ ids });
  return databaseListings ?? [];
}

/** @deprecated LEGACY ONLY: Used by migration scripts. */
export async function getLegacyStoredUserListings(sellerId: string) {
  return (await getLegacyStoredListings()).filter((listing) => listing.sellerId === sellerId);
}

export async function upsertDatabaseListingRecord(listing: Listing) {
  if (!hasSupabaseAdminEnv()) return null;
  const updatedListing = await updateDatabaseListing(listing);
  if (updatedListing.listing) return updatedListing.listing; // Corrected to return listing directly for compatibility
  
  const created = await createDatabaseListing(listing);
  return created.listing ?? null;
}

// Export persistence functions for direct use if needed
export { createDatabaseListing, updateDatabaseListing, mapListingToDatabaseRow, mapListingImagesToDatabaseRows };
