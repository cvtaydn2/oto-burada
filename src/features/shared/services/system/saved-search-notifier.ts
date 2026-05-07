/**
 * Saved Search Notifications - Server Function
 *
 * ── SECURITY FIX: Issue SEC-CRON-01 - No HTTP Fetch with Cron Secret ──
 * Shared server function for triggering saved search notifications.
 * Called by both cron jobs and API routes without passing secrets via HTTP.
 */

import "server-only";

import { createSearchParamsFromListingFilters } from "@/features/marketplace/services/listing-filters";
import { getPublicFilteredDatabaseListings } from "@/features/marketplace/services/listing-submissions";
import { normalizeSavedSearchFilters } from "@/features/marketplace/services/saved-search-utils";
import type { SavedSearchAlertListing } from "@/features/notifications/services/email-templates";
import { createSupabaseAdminClient } from "@/features/shared/lib/admin";
import { getAppUrlWithFallback } from "@/features/shared/lib/env";
import { hasSupabaseAdminEnv } from "@/features/shared/lib/env";
import { logger } from "@/features/shared/lib/logger";
import { enqueueOutboxEvent } from "@/features/shared/services/outbox-processor";
import type { ListingFilters } from "@/types";

// How far back to look for new listings (24 hours)
const LOOKBACK_HOURS = 24;
const FILTER_RESULT_CACHE = new Map<
  string,
  Awaited<ReturnType<typeof getPublicFilteredDatabaseListings>>
>();

export interface SavedSearchNotificationResult {
  success: boolean;
  processed: number;
  notified: number;
  skipped: number;
  errors: number;
  error?: string;
}

/**
 * Triggers saved search notifications for all active saved searches.
 * This is the shared business logic extracted from the API route.
 */
export async function triggerSavedSearchNotifications(): Promise<SavedSearchNotificationResult> {
  if (!hasSupabaseAdminEnv()) {
    return {
      success: false,
      processed: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
      error: "Database not configured",
    };
  }

  const admin = createSupabaseAdminClient();
  const lookbackDate = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

  // 1. Fetch all active saved searches with notifications enabled
  const { data: savedSearches, error: searchError } = await admin
    .from("saved_searches")
    .select("id, user_id, title, filters")
    .eq("notifications_enabled", true);

  if (searchError || !savedSearches) {
    logger.notifications.error("Failed to fetch saved searches for notification", searchError);
    return {
      success: false,
      processed: 0,
      notified: 0,
      skipped: 0,
      errors: 1,
      error: searchError?.message || "Failed to fetch saved searches",
    };
  }

  if (savedSearches.length === 0) {
    logger.notifications.info("No saved searches with notifications enabled");
    return {
      success: true,
      processed: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
    };
  }

  // 2. Get unique user IDs to fetch their emails — paginate to handle >1000 users
  const userIds = [...new Set(savedSearches.map((s) => s.user_id))];
  const userEmailMap = new Map<string, { email: string; name: string }>();
  let authPage = 1;
  while (true) {
    const { data: authData } = await admin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
    const users = authData?.users ?? [];
    for (const user of users) {
      if (userIds.includes(user.id)) {
        const name = (user.user_metadata as { full_name?: string })?.full_name ?? "Kullanıcı";
        userEmailMap.set(user.id, { email: user.email ?? "", name });
      }
    }
    if (users.length < 1000 || userEmailMap.size >= userIds.length) break;
    authPage++;
  }

  let notifiedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // 3. Process each saved search
  for (const savedSearch of savedSearches) {
    const userInfo = userEmailMap.get(savedSearch.user_id);

    if (!userInfo?.email) {
      skippedCount++;
      continue;
    }

    try {
      const filters = normalizeSavedSearchFilters((savedSearch.filters ?? {}) as ListingFilters);

      // PERF: cache repeated filter lookups during single cron run
      const filterCacheKey = JSON.stringify({ ...filters, limit: 10, page: 1, sort: "newest" });
      let result = FILTER_RESULT_CACHE.get(filterCacheKey);

      if (!result) {
        result = await getPublicFilteredDatabaseListings({
          ...filters,
          limit: 10,
          page: 1,
          sort: "newest",
        });
        FILTER_RESULT_CACHE.set(filterCacheKey, result);
      }

      // Filter to only listings created after lookback date
      const newListings = result.listings.filter((l) => l.createdAt >= lookbackDate);

      if (newListings.length === 0) {
        skippedCount++;
        continue;
      }

      // Build search URL for the email CTA
      const appUrl = getAppUrlWithFallback();
      const searchParams = createSearchParamsFromListingFilters(filters);
      const searchUrl = `${appUrl}/listings?${searchParams.toString()}`;

      const alertListings: SavedSearchAlertListing[] = newListings.map((l) => ({
        title: l.title,
        brand: l.brand,
        model: l.model,
        year: l.year,
        price: l.price,
        city: l.city,
        slug: l.slug,
        imageUrl: l.images.find((img) => img.isCover)?.url,
      }));

      await enqueueOutboxEvent(admin, "email_notification", {
        template: "saved_search_alert",
        params: {
          toEmail: userInfo.email,
          toName: userInfo.name,
          searchTitle: savedSearch.title,
          searchUrl,
          newListings: alertListings,
        },
      });

      notifiedCount++;
      logger.notifications.info("Saved search alert enqueued", {
        userId: savedSearch.user_id,
        searchId: savedSearch.id,
        listingCount: newListings.length,
      });
    } catch (_e) {
      errorCount++;
      logger.notifications.error("Failed to process saved search notification", _e, {
        searchId: savedSearch.id,
        userId: savedSearch.user_id,
      });
    }
  }

  return {
    success: true,
    processed: savedSearches.length,
    notified: notifiedCount,
    skipped: skippedCount,
    errors: errorCount,
  };
}
