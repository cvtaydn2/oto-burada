import { deleteListing as deleteFromDb } from "../listing-submission-persistence";
import { getStoredListingById } from "../queries/get-listings";

export async function deleteDatabaseListing(listingId: string, sellerId: string) {
  // Fetch the listing to verify ownership, status, and VERSION
  const listing = await getStoredListingById(listingId);

  if (!listing || listing.sellerId !== sellerId) return null;
  if (listing.status !== "archived") return null;

  // 1. Perform Atomic Deletion FIRST
  const result = await deleteFromDb(listingId, listing.version ?? 0);

  if (result.error === "concurrent_update_detected") {
    return { error: "CONFLICT" as const };
  }

  if (!result.success) {
    return null;
  }

  // 2. Storage Cleanup
  if (listing.images.length > 0) {
    const storagePaths = listing.images
      .map((img) => img.storagePath)
      .filter((path) => path.length > 0);

    if (storagePaths.length > 0) {
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS ?? "listing-images";
      const { queueFileCleanup } = await import("@/lib/storage/registry");
      queueFileCleanup(bucketName, storagePaths).catch((err) => {
        console.error("[deleteDatabaseListing] Storage cleanup failed:", err);
      });
    }
  }

  return { id: listingId, deleted: true };
}
