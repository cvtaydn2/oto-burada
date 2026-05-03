/**
 * Favorites database operations.
 *
 * SECURITY: Uses server client (authenticated role) instead of admin client.
 * RLS policy "favorites_manage_own" ensures users can only access their own favorites.
 *
 * Policy: FOR ALL USING ((SELECT auth.uid()) = user_id)
 *
 * No silent fallbacks - all errors are thrown for proper error handling.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface FavoriteRow {
  listing_id: string;
}

async function getFavoritesClient() {
  return await createSupabaseServerClient();
}

/**
 * Get all favorite listing IDs for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 * @throws Error if userId is invalid or database query fails
 */
export async function getDatabaseFavoriteIds(userId: string): Promise<string[]> {
  if (!userId) {
    throw new Error("userId is required");
  }

  const supabase = await getFavoritesClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .returns<FavoriteRow[]>();

  if (error) {
    throw new Error(`Failed to fetch favorites: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map((favorite) => favorite.listing_id);
}

/**
 * Get favorite count for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 * @throws Error if userId is invalid or database query fails
 */
export async function getDatabaseFavoriteCount(userId: string): Promise<number> {
  if (!userId) {
    throw new Error("userId is required");
  }

  const supabase = await getFavoritesClient();
  const { count, error } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to count favorites: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Add a favorite for the current authenticated user.
 * RLS policy ensures user_id must match auth.uid().
 * @throws Error if userId or listingId is invalid, or database operation fails
 */
export async function addDatabaseFavorite(userId: string, listingId: string): Promise<string[]> {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!listingId) {
    throw new Error("listingId is required");
  }

  const supabase = await getFavoritesClient();
  const { error } = await supabase
    .from("favorites")
    .upsert({ listing_id: listingId, user_id: userId }, { onConflict: "user_id,listing_id" });

  if (error) {
    throw new Error(`Failed to add favorite: ${error.message}`);
  }

  return getDatabaseFavoriteIds(userId);
}

/**
 * Remove a favorite for the current authenticated user.
 * RLS policy ensures user can only delete their own favorites.
 * @throws Error if userId or listingId is invalid, or database operation fails
 */
export async function removeDatabaseFavorite(userId: string, listingId: string): Promise<string[]> {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!listingId) {
    throw new Error("listingId is required");
  }

  const supabase = await getFavoritesClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    throw new Error(`Failed to remove favorite: ${error.message}`);
  }

  return getDatabaseFavoriteIds(userId);
}
