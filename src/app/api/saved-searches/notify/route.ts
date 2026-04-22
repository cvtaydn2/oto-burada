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
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { sendSavedSearchAlertEmail } from "@/services/email/email-service";
import type { SavedSearchAlertListing } from "@/services/email/email-templates";
import { getFilteredDatabaseListings } from "@/services/listings/listing-submissions";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { normalizeSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";
import { logger } from "@/lib/utils/logger";
import type { ListingFilters } from "@/types";
import { Redis } from "@upstash/redis";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Gets the application URL from environment variables.
 * Fails closed in production if NEXT_PUBLIC_APP_URL is not set.
 * 
 * @throws Error in production if NEXT_PUBLIC_APP_URL is missing
 * @returns Application URL
 */
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL must be set in production");
    }
    // Development fallback
    return "http://localhost:3000";
  }
  
  return url;
}

// Upstash Redis instance (lazy loaded conditionally)
function getRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// How far back to look for new listings (24 hours)
const LOOKBACK_HOURS = 24;

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // CRON_SECRET must always be set in production — fail closed if missing
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// Vercel Cron sends GET requests — this is the primary handler for Emails
// BUT this is also the endpoint for SSE Realtime connection from clients!
export async function GET(request: Request) {
  // Distinguish between SSE (Browser Client) and Cron (Vercel/Internal)
  const isEventStream = request.headers.get("accept") === "text/event-stream";
  
  if (isEventStream) {
    return handleSSERequest(request);
  }
  
  return handleCronRequest(request);
}

// Internal trigger for publishing a notification or triggering cron
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const payload = await request.json();
      if (payload.action === "publish_notification" && payload.userId && payload.message) {
        // Publish to Upstash Redis directly if requested
        const redis = getRedisClient();
        if (redis) {
          const key = `notifications:${payload.userId}`;
          // Add to a sorted set with timestamp as score
          await redis.zadd(key, { score: Date.now(), member: JSON.stringify({
            id: Date.now().toString(),
            message: payload.message,
            title: payload.title || "Yeni Bildirim",
            link: payload.link,
            createdAt: new Date().toISOString(),
          }) });
          return apiSuccess({ published: true });
        }
        return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Redis yapılandırılmamış");
      }
    }
  } catch {
    // Fallback to cron
  }
  return handleCronRequest(request);
}

/**
 * Handles SSE streams by polling Upstash Redis for user notifications.
 * Implements strict security and resource cleanup.
 */
async function handleSSERequest(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const redis = getRedisClient();
  if (!redis) {
    logger.notifications.error("Redis client unavailable for SSE");
    return new Response("Service Unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection successful
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      const key = `notifications:${userId}`;
      let lastCheck = Date.now();

      // Poll Redis for new notifications
      intervalId = setInterval(async () => {
        try {
          if (request.signal.aborted) {
            if (intervalId) clearInterval(intervalId);
            return;
          }

          const newNotifications = await redis.zrange(key, lastCheck + 1, "+inf", { 
            byScore: true 
          });

          if (newNotifications && newNotifications.length > 0) {
            for (const notice of newNotifications) {
              controller.enqueue(encoder.encode(`data: ${notice}\n\n`));
            }
            lastCheck = Date.now();
          }
          
          // Keep-alive ping
          controller.enqueue(encoder.encode(':\n\n'));
        } catch (error) {
          logger.notifications.error("SSE Polling Error", error);
        }
      }, 5000); // 5s is more reasonable for serverless polling

      // Comprehensive cleanup
      request.signal.addEventListener("abort", () => {
        if (intervalId) clearInterval(intervalId);
        try { controller.close(); } catch (e) {}
      });
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    }
  });

  // Tighter headers for authenticated stream
  const appUrl = getAppUrl();
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform, no-store",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": appUrl,
      "Access-Control-Allow-Credentials": "true",
    },
  });
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
      const filters = normalizeSavedSearchFilters(
        (savedSearch.filters ?? {}) as ListingFilters,
      );

      // Query new listings matching this search, created in the last 24h
      const result = await getFilteredDatabaseListings({
        ...filters,
        limit: 10,
        page: 1,
        sort: "newest",
      });

      // Filter to only listings created after lookback date
      const newListings = result.listings.filter(
        (l) => l.createdAt >= lookbackDate,
      );

      if (newListings.length === 0) {
        skippedCount++;
        continue;
      }

      // Build search URL for the email CTA
      const appUrl = getAppUrl();
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
      errors: errorCount 
    },
    `${notifiedCount} kullanıcıya bildirim gönderildi, ${skippedCount} arama için yeni sonuç yok.`
  );
}
