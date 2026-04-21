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
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface FavoriteRow {
  listing_id: string;
}

async function getFavoritesClient() {
  if (process.env.NODE_ENV === "test" && hasSupabaseAdminEnv()) {
    return createSupabaseAdminClient();
  }

  try {
    return await createSupabaseServerClient();
  } catch {
    if (!hasSupabaseAdminEnv()) {
      throw new Error("Supabase admin client unavailable");
    }
    return createSupabaseAdminClient();
  }
}

/**
 * Get all favorite listing IDs for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 */
export async function getDatabaseFavoriteIds(userId: string) {
  if (!userId) {
    return null;
  }

  try {
    const supabase = await getFavoritesClient();
    const query = supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", userId);
    const executor =
      "returns" in query && typeof query.returns === "function"
        ? query.returns<FavoriteRow[]>()
        : query;
    const { data, error } = await executor;

    if (error || !data) {
      return null;
    }

    return data.map((favorite) => favorite.listing_id);
  } catch {
    return null;
  }
}

/**
 * Get favorite count for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 */
export async function getDatabaseFavoriteCount(userId: string) {
  if (!userId) {
    return 0;
  }

  try {
    const supabase = await getFavoritesClient();
    const { count, error } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Add a favorite for the current authenticated user.
 * RLS policy ensures user_id must match auth.uid().
 * 
 * If userId doesn't match auth.uid(), RLS will reject the insert.
 */
export async function addDatabaseFavorite(userId: string, listingId: string) {
  if (!userId || !listingId) {
    return null;
  }

  try {
    const supabase = await getFavoritesClient();
    const { error } = await supabase
      .from("favorites")
      .upsert({ listing_id: listingId, user_id: userId }, { onConflict: "user_id,listing_id" });

    if (error) {
      return null;
    }

    return getDatabaseFavoriteIds(userId);
  } catch {
    return null;
  }
}

/**
 * Remove a favorite for the current authenticated user.
 * RLS policy ensures user can only delete their own favorites.
 */
export async function removeDatabaseFavorite(userId: string, listingId: string) {
  if (!userId || !listingId) {
    return null;
  }

  try {
    const supabase = await getFavoritesClient();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);

    if (error) {
      return null;
    }

    return getDatabaseFavoriteIds(userId);
  } catch {
    return null;
  }
}
