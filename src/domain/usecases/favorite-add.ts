import { addDatabaseFavorite } from "@/services/favorites/favorite-records";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { getStoredProfileById } from "@/services/profile/profile-records";

export interface FavoriteAddResult {
  success: boolean;
  favoriteIds?: string[];
  error?: string;
  metadata?: {
    sellerId: string;
    listingTitle: string;
    listingSlug: string;
    actorName: string;
  };
}

export async function favoriteAddUseCase(
  userId: string,
  listingId: string
): Promise<FavoriteAddResult> {
  // 1. Validate Listing
  const listing = await getStoredListingById(listingId);
  if (!listing) {
    return { success: false, error: "Listing not found." };
  }

  if (listing.status !== "approved") {
    return { success: false, error: "Only approved listings can be favorited." };
  }

  // 2. Perform persistence
  const favoriteIds = await addDatabaseFavorite(userId, listingId);
  if (!favoriteIds) {
    return { success: false, error: "Failed to add favorite." };
  }

  // 3. Prepare Notification Metadata
  const actorProfile = await getStoredProfileById(userId);

  return {
    success: true,
    favoriteIds,
    metadata: {
      sellerId: listing.sellerId,
      listingTitle: listing.title,
      listingSlug: listing.slug,
      actorName: actorProfile?.fullName ?? "A user",
    },
  };
}
