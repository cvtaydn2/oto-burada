import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

interface FavoriteRow {
  listing_id: string;
  user_id: string;
}

export async function getDatabaseFavoriteIds(userId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("favorites")
    .select("user_id, listing_id")
    .eq("user_id", userId)
    .returns<FavoriteRow[]>();

  if (error || !data) {
    return null;
  }

  return data.map((favorite) => favorite.listing_id);
}

export async function addDatabaseFavorite(userId: string, listingId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("favorites")
    .upsert({ listing_id: listingId, user_id: userId }, { onConflict: "user_id,listing_id" });

  if (error) {
    return null;
  }

  return getDatabaseFavoriteIds(userId);
}

export async function removeDatabaseFavorite(userId: string, listingId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    return null;
  }

  return getDatabaseFavoriteIds(userId);
}
