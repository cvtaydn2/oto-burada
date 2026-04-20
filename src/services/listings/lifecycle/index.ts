import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Listing } from "@/types";
import { getDatabaseListings } from "../listing-submission-query";

/**
 * Handles listing lifecycle events such as archiving, deletion, and status changes.
 */

export async function archiveListing(listingId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({
      status: "archived" satisfies Listing["status"],
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  return !error;
}

export async function deleteArchivedListing(listingId: string, sellerId: string) {
  const admin = createSupabaseAdminClient();
  const listings = await getDatabaseListings({ listingId, sellerId });
  const listing = listings?.[0];

  if (!listing || listing.status !== "archived") return false;

  // Cleanup storage images
  if (listing.images.length > 0) {
    const storagePaths = listing.images.map(img => img.storagePath).filter(Boolean);
    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      await admin.storage.from(bucketName).remove(storagePaths);
    }
  }

  // Delete relations
  await admin.from("listing_images").delete().eq("listing_id", listingId);
  await admin.from("favorites").delete().eq("listing_id", listingId);
  await admin.from("reports").delete().eq("listing_id", listingId);
  
  const { error } = await admin.from("listings").delete().eq("id", listingId);
  return !error;
}

export async function updateListingStatus(listingId: string, status: Listing["status"]) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", listingId);

  return !error;
}
