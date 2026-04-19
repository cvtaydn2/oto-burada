/**
 * Favorites database operations.
 * 
 * SECURITY: Uses server client (authenticated role) instead of admin client.
 * RLS policy "favorites_manage_own" ensures users can only access their own favorites.
 * 
 * Policy: FOR ALL USING ((SELECT auth.uid()) = user_id)
 * 
 * This means:
 * - User can only SELECT their own favorites
 * - User can only INSERT favorites with their own user_id
 * - User can only UPDATE/DELETE their own favorites
 * 
 * No need for explicit userId checks in this layer — RLS enforces it at DB level.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

interface FavoriteRow {
  listing_id: string;
}

/**
 * Get all favorite listing IDs for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 */
export async function getDatabaseFavoriteIds(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)  // Redundant but explicit — RLS already filters
    .returns<FavoriteRow[]>();

  if (error || !data) {
    return null;
  }

  return data.map((favorite) => favorite.listing_id);
}

/**
 * Get favorite count for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 */
export async function getDatabaseFavoriteCount(userId: string) {
  if (!hasSupabaseEnv()) {
    return 0;
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);  // Redundant but explicit — RLS already filters

  if (error) return 0;
  return count ?? 0;
}

/**
 * Add a favorite for the current authenticated user.
 * RLS policy ensures user_id must match auth.uid().
 * 
 * If userId doesn't match auth.uid(), RLS will reject the insert.
 */
export async function addDatabaseFavorite(userId: string, listingId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("favorites")
    .upsert({ listing_id: listingId, user_id: userId }, { onConflict: "user_id,listing_id" });

  if (error) {
    return null;
  }

  return getDatabaseFavoriteIds(userId);
}

/**
 * Remove a favorite for the current authenticated user.
 * RLS policy ensures user can only delete their own favorites.
 */
export async function removeDatabaseFavorite(userId: string, listingId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    return null;
  }

  return getDatabaseFavoriteIds(userId);
}
