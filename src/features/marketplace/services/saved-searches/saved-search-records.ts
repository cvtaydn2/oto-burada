/**
 * Saved searches database operations.
 *
 * SECURITY: Uses server client (authenticated role) instead of admin client.
 * RLS policy "saved_searches_manage_own" ensures users can only access their own searches.
 *
 * Policy: FOR ALL USING ((SELECT auth.uid()) = user_id)
 *
 * This means:
 * - User can only SELECT their own saved searches
 * - User can only INSERT searches with their own user_id
 * - User can only UPDATE/DELETE their own searches
 *
 * No need for explicit userId checks in this layer — RLS enforces it at DB level.
 */

import {
  buildSavedSearchTitle,
  getSavedSearchSignature,
  normalizeSavedSearchFilters,
} from "@/features/marketplace/services/saved-search-utils";
import { savedSearchSchema } from "@/features/shared/lib";
import { hasSupabaseEnv } from "@/features/shared/lib/env";
import { createSupabaseServerClient } from "@/features/shared/lib/server";
import type { ListingFilters, SavedSearchCreateInput } from "@/types";

interface SavedSearchRow {
  created_at: string;
  filters: unknown;
  id: string;
  notifications_enabled: boolean;
  title: string;
  updated_at: string;
  user_id: string;
}

function mapSavedSearchRow(row: SavedSearchRow) {
  return savedSearchSchema.parse({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    filters: normalizeSavedSearchFilters((row.filters ?? {}) as ListingFilters),
    notificationsEnabled: row.notifications_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

/**
 * Get saved searches for the current authenticated user.
 * RLS automatically filters to auth.uid() = user_id.
 */
async function getDatabaseSavedSearches(options?: { searchId?: string; userId?: string }) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("saved_searches")
    .select("id, user_id, title, filters, notifications_enabled, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (options?.userId) {
    query = query.eq("user_id", options.userId); // Redundant but explicit — RLS already filters
  }

  if (options?.searchId) {
    query = query.eq("id", options.searchId);
  }

  const { data, error } = await query.returns<SavedSearchRow[]>();

  if (error || !data) {
    return null;
  }

  return data.map(mapSavedSearchRow);
}

/**
 * Get all saved searches for a specific user.
 * RLS ensures only the authenticated user's searches are returned.
 */
export async function getStoredSavedSearchesByUser(userId: string) {
  return (await getDatabaseSavedSearches({ userId })) ?? [];
}

/**
 * Create or update a saved search for the current authenticated user.
 * RLS policy ensures user_id must match auth.uid().
 *
 * If a search with the same filter signature exists, it's updated.
 * Otherwise, a new search is created.
 */
export async function createOrUpdateDatabaseSavedSearch(
  userId: string,
  input: SavedSearchCreateInput
) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const normalizedFilters = normalizeSavedSearchFilters(input.filters);
  const timestamp = new Date().toISOString();
  const title = input.title?.trim() || buildSavedSearchTitle(normalizedFilters);
  const notificationsEnabled = input.notificationsEnabled ?? true;
  const existingSearches = await getStoredSavedSearchesByUser(userId);
  const existingSearch = existingSearches.find((search) => {
    const existingSig = getSavedSearchSignature(search.filters).toLowerCase();
    const newSig = getSavedSearchSignature(normalizedFilters).toLowerCase();
    return existingSig === newSig;
  });
  const supabase = await createSupabaseServerClient();

  if (existingSearch?.id) {
    // Update existing search (case-insensitive comparison via normalized filters)
    // RLS ensures we can only update our own searches
    const { error } = await supabase
      .from("saved_searches")
      .update({
        filters: normalizedFilters,
        notifications_enabled: notificationsEnabled,
        title,
        updated_at: timestamp,
      })
      .eq("id", existingSearch.id)
      .eq("user_id", userId); // Redundant but explicit — RLS already filters

    if (error) {
      return null;
    }

    return (await getDatabaseSavedSearches({ searchId: existingSearch.id, userId }))?.[0] ?? null;
  }

  // Create new search
  // RLS ensures user_id must match auth.uid()
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      filters: normalizedFilters,
      notifications_enabled: notificationsEnabled,
      title,
      user_id: userId,
    })
    .select("id, user_id, title, filters, notifications_enabled, created_at, updated_at")
    .single<SavedSearchRow>();

  if (error || !data) {
    return null;
  }

  return mapSavedSearchRow({
    ...data,
    updated_at: data.updated_at ?? timestamp,
  });
}

/**
 * Update a saved search for the current authenticated user.
 * RLS ensures we can only update our own searches.
 */
export async function updateDatabaseSavedSearch(
  userId: string,
  searchId: string,
  updates: { notificationsEnabled?: boolean; title?: string }
) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.notificationsEnabled !== undefined) {
    payload.notifications_enabled = updates.notificationsEnabled;
  }

  if (updates.title !== undefined) {
    payload.title = updates.title.trim();
  }

  // RLS ensures we can only update our own searches
  const { error } = await supabase
    .from("saved_searches")
    .update(payload)
    .eq("id", searchId)
    .eq("user_id", userId); // Redundant but explicit — RLS already filters

  if (error) {
    return null;
  }

  return (await getDatabaseSavedSearches({ searchId, userId }))?.[0] ?? null;
}

/**
 * Delete a saved search for the current authenticated user.
 * RLS ensures we can only delete our own searches.
 */
export async function deleteDatabaseSavedSearch(userId: string, searchId: string) {
  if (!hasSupabaseEnv()) {
    return false;
  }

  const supabase = await createSupabaseServerClient();

  // RLS ensures we can only delete our own searches
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", userId); // Redundant but explicit — RLS already filters

  return !error;
}
