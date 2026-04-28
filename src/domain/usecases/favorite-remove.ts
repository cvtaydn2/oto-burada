import { removeDatabaseFavorite } from "@/services/favorites/favorite-records";

export interface FavoriteRemoveResult {
  success: boolean;
  favoriteIds?: string[];
  error?: string;
}

export async function favoriteRemoveUseCase(
  userId: string,
  listingId: string
): Promise<FavoriteRemoveResult> {
  const favoriteIds = await removeDatabaseFavorite(userId, listingId);

  return {
    success: true,
    favoriteIds,
  };
}
