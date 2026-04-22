/**
 * GET /api/saved-searches/notify  (Vercel Cron — GET)
 * POST /api/saved-searches/notify (manual/internal trigger)
 *
 * Internal endpoint — called by a cron job or Supabase webhook when new listings
 * match saved searches with notifications_enabled = true.
 *
 * Security: requires CRON_SECRET header (Authorization: Bearer <secret>).
 * Vercel automatically sends this header when CRON_SECRET env var is set.
 *
 * Flow:
 * 1. Fetch all saved searches with notifications_enabled = true
 * 2. For each search, query listings created in the last 24h matching the filters
 * 3. If matches found, send email alert to the user
 *
 * To trigger from Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/saved-searches/notify", "schedule": "0 9 * * *" }]
 * }
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { sendSavedSearchAlertEmail } from "@/services/email/email-service";
import type { SavedSearchAlertListing } from "@/services/email/email-templates";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { getFilteredDatabaseListings } from "@/services/listings/listing-submissions";
import { normalizeSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";
import type { ListingFilters } from "@/types";

export const dynamic = "force-dynamic";

import { getAppUrlWithFallback } from "@/lib/utils/env";

// How far back to look for new listings (24 hours)
const LOOKBACK_HOURS = 24;

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Main handler for Vercel Cron.
 * Triggers email notifications for saved searches with new matches.
 */
export async function GET(request: Request) {
  return handleCronRequest(request);
}

/**
 * Support POST for manual triggers (e.g., from admin panel)
 */
export async function POST(request: Request) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
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
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kayıtlı aramalar alınamadı.", 500);
  }

  if (savedSearches.length === 0) {
    return apiSuccess({ processed: 0, notified: 0 }, "Bildirim gönderilecek kayıtlı arama yok.");
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

      // Query new listings matching this search, created in the last 24h
      const result = await getFilteredDatabaseListings({
        ...filters,
        limit: 10,
        page: 1,
        sort: "newest",
      });

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

      const emailResult = await sendSavedSearchAlertEmail({
        toEmail: userInfo.email,
        toName: userInfo.name,
        searchTitle: savedSearch.title,
        searchUrl,
        newListings: alertListings,
      });

      if (emailResult.success) {
        notifiedCount++;
        logger.notifications.info("Saved search alert sent", {
          userId: savedSearch.user_id,
          searchId: savedSearch.id,
          listingCount: newListings.length,
        });
      } else {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
      logger.notifications.error("Failed to process saved search notification", err, {
        searchId: savedSearch.id,
        userId: savedSearch.user_id,
      });
    }
  }

  return apiSuccess(
    {
      processed: savedSearches.length,
      notified: notifiedCount,
      skipped: skippedCount,
      errors: errorCount,
    },
    `${notifiedCount} kullanıcıya bildirim gönderildi, ${skippedCount} arama için yeni sonuç yok.`
  );
}
