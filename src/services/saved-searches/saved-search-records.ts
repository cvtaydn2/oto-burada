import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { savedSearchSchema } from "@/lib/validators";
import {
  buildSavedSearchTitle,
  getSavedSearchSignature,
  normalizeSavedSearchFilters,
} from "@/services/saved-searches/saved-search-utils";
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

async function getDatabaseSavedSearches(options?: {
  searchId?: string;
  userId?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("saved_searches")
    .select("id, user_id, title, filters, notifications_enabled, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
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

export async function getStoredSavedSearchesByUser(userId: string) {
  return (await getDatabaseSavedSearches({ userId })) ?? [];
}

export async function createOrUpdateDatabaseSavedSearch(
  userId: string,
  input: SavedSearchCreateInput,
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const normalizedFilters = normalizeSavedSearchFilters(input.filters);
  const timestamp = new Date().toISOString();
  const title = input.title?.trim() || buildSavedSearchTitle(normalizedFilters);
  const notificationsEnabled = input.notificationsEnabled ?? true;
  const existingSearches = await getStoredSavedSearchesByUser(userId);
  const existingSearch = existingSearches.find(
    (search) => getSavedSearchSignature(search.filters) === getSavedSearchSignature(normalizedFilters),
  );
  const admin = createSupabaseAdminClient();

  if (existingSearch?.id) {
    const { error } = await admin
      .from("saved_searches")
      .update({
        filters: normalizedFilters,
        notifications_enabled: notificationsEnabled,
        title,
        updated_at: timestamp,
      })
      .eq("id", existingSearch.id)
      .eq("user_id", userId);

    if (error) {
      return null;
    }

    return (await getDatabaseSavedSearches({ searchId: existingSearch.id, userId }))?.[0] ?? null;
  }

  const { data, error } = await admin
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

export async function updateDatabaseSavedSearch(
  userId: string,
  searchId: string,
  updates: { notificationsEnabled?: boolean; title?: string },
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.notificationsEnabled !== undefined) {
    payload.notifications_enabled = updates.notificationsEnabled;
  }

  if (updates.title !== undefined) {
    payload.title = updates.title.trim();
  }

  const { error } = await admin
    .from("saved_searches")
    .update(payload)
    .eq("id", searchId)
    .eq("user_id", userId);

  if (error) {
    return null;
  }

  return (await getDatabaseSavedSearches({ searchId, userId }))?.[0] ?? null;
}

export async function deleteDatabaseSavedSearch(userId: string, searchId: string) {
  if (!hasSupabaseAdminEnv()) {
    return false;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", userId);

  return !error;
}
