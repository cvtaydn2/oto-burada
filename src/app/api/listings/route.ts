import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";

import { executeListingCreation } from "@/domain/usecases/listing-create";
import { parseListingFiltersFromSearchParams } from "@/features/marketplace/services/listing-filters";
import { checkListingLimit } from "@/features/marketplace/services/listing-limits";
import {
  performAsyncModeration,
  runListingTrustGuards,
} from "@/features/marketplace/services/listing-submission-moderation";
import {
  createDatabaseListing,
  getDatabaseListings,
} from "@/features/marketplace/services/listing-submissions";
import { getFilteredMarketplaceListings } from "@/features/marketplace/services/marketplace-listings";
import { createDatabaseNotification } from "@/features/notifications/services/notification-records";
import { AnalyticsEvent } from "@/lib/events";
import { mapUseCaseError, validateRequestBody } from "@/lib/handler-utils";
import { listingCreateSchema } from "@/lib/listing";
import { logger } from "@/lib/logger";
import { rateLimitProfiles } from "@/lib/rate-limit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/rate-limit-middleware";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withUserAndCsrf } from "@/lib/security";
import { captureServerError, trackServerEvent } from "@/lib/telemetry-server";
import { verifyTurnstileToken } from "@/lib/turnstile";

// This endpoint now handles ONLY public marketplace search.

// Private user listings moved to /api/listings/mine
//
// Benefits:
// - Clear separation of concerns
// - Public data can be cached aggressively
// - Simpler rate limiting strategy
// - Better monitoring and metrics
//
// ── PERFORMANCE FIX: Issue #20 - Response Caching Configuration ─────
// Enable Next.js ISR (Incremental Static Regeneration) for public marketplace listings.
// This reduces database load and improves response times for high-traffic pages.
// - revalidate: 30 seconds - Fresh data while reducing DB queries
// CDN cache headers are the single source of truth for this route.
// Avoid ISR revalidation invocation overhead for high-traffic marketplace API.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // ── ARCHITECTURE FIX: Issue #8 - Redirect Legacy ?view=my Requests ─────
  // For backward compatibility, redirect to new endpoint
  const view = searchParams.get("view");
  if (view === "my") {
    return Response.redirect(new URL("/api/listings/mine", request.url), 308);
  }

  // Rate limit public search — 120 requests per minute per IP
  const ipRateLimit = await enforceRateLimit(getRateLimitKey(request, "api:listings:search"), {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (ipRateLimit.response) return ipRateLimit.response;

  // Convert URLSearchParams to a key-value object
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
  });

  const filters = parseListingFiltersFromSearchParams(paramsObj);

  try {
    const result = await getFilteredMarketplaceListings(filters);

    // ── PERFORMANCE FIX: Issue #20 - Cache-Control Headers ─────
    // Add stale-while-revalidate for better performance and reduced DB load.
    // - s-maxage=30: CDN caches for 30 seconds
    // - stale-while-revalidate=60: Serve stale content while revalidating in background
    return apiSuccess(result, undefined, 200, {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    });
  } catch (error) {
    captureServerError("GET /api/listings failed", "listings", error, { filters: paramsObj });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlanlar yüklenirken bir hata oluştu.", 500);
  }
}

export async function POST(request: Request) {
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.listingCreate,
    rateLimitKey: "listings:create",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  // ── SECURITY FIX: Issue #13 - Quota vs Save Race Condition ─────
  // Use a distributed lock to prevent concurrent listing creation requests
  // from bypassing quota checks.
  const lockKey = `lock:listing_create:${user.id}`;
  const { redis } = await import("@/lib/redis/client");

  if (redis) {
    const lock = await redis.set(lockKey, "LOCKED", { nx: true, ex: 15 });
    if (!lock) {
      return apiError(
        API_ERROR_CODES.RATE_LIMITED,
        "İşleminiz devam ediyor, lütfen birkaç saniye bekleyin.",
        429
      );
    }
  }

  try {
    // 1. Structural Validation (F-14 Defense in Depth)
    const validation = await validateRequestBody(request, listingCreateSchema);
    if (!validation.success) return validation.response;
    const input = validation.data;

    // 2. Bot Protection
    const turnstileToken = String((input as { turnstileToken?: string }).turnstileToken || "");
    const isHuman = await verifyTurnstileToken(turnstileToken);
    if (!isHuman) {
      return apiError(
        API_ERROR_CODES.FORBIDDEN,
        "Güvenlik doğrulaması başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin.",
        403
      );
    }

    // Orchestrate via Domain Use Case (SOLID)
    // ── ARCHITECTURE ANALYSIS: Issue #13 - Quota Check vs Listing Save Atomicity ─────
    // The quota check (checkListingLimit) and listing save (saveListing) are separate
    // operations, but this is SAFE in the current implementation because:
    //
    // 1. The RPC `check_and_reserve_listing_quota` only CHECKS quota, it doesn't modify state
    // 2. The actual quota consumption happens when the listing is inserted (status = pending/approved)
    // 3. If saveListing fails, no listing is created, so no quota is consumed
    // 4. The FOR UPDATE lock prevents race conditions during the check window
    //
    // RISK SCENARIO: If we later add a "reserved_quota" counter that increments during
    // the check phase (before listing insert), we would need compensation logic to
    // decrement it on save failure. Current implementation doesn't have this issue.
    //
    // ALTERNATIVE APPROACH: Move the entire flow into a single Postgres function that
    // checks quota and inserts listing atomically. This would eliminate the window between
    // check and insert, but adds complexity to the database layer.
    const result = await executeListingCreation(input, user.id, {
      checkQuota: (uid) => checkListingLimit(uid),
      getExistingListings: async (sellerId: string) => {
        const listings = await getDatabaseListings({
          sellerId,
          statuses: ["draft", "pending", "approved"],
        });
        return (listings ?? []).map((l) => ({
          id: l.id,
          slug: l.slug,
          brand: l.brand,
          model: l.model,
          year: l.year,
          mileage: l.mileage,
          price: l.price,
          vin: l.vin,
          status: l.status,
        }));
      },
      runTrustGuards: (input) => runListingTrustGuards(input),
      saveListing: (listing) => createDatabaseListing(listing),
      notifyUser: async (listing) => {
        await createDatabaseNotification({
          href: `/dashboard/listings?edit=${listing.id}`,
          message: `"${listing.title}" ilanın incelemeye alındı.`,
          title: "İlanın incelemeye alındı",
          type: "moderation",
          userId: user.id,
        });
      },
      trackEvent: (listing) => {
        trackServerEvent(
          AnalyticsEvent.SERVER_LISTING_CREATED,
          {
            listingId: listing.id,
            brand: listing.brand,
            model: listing.model,
            city: listing.city,
            price: listing.price,
            status: listing.status,
          },
          user.id
        );
      },
      runAsyncModeration: (id, listingSnapshot) => {
        waitUntil(
          performAsyncModeration(id, listingSnapshot).catch((error) => {
            logger.listings.error("Async moderation failed in background", error, {
              listingId: id,
              userId: user.id,
            });
            Sentry.captureException(error, {
              tags: { feature: "async-moderation", listingId: id },
              extra: { userId: user.id },
            });
            // Error is logged + tracked but doesn't block the main request
            return Promise.resolve();
          })
        );
      },
    });

    if (!result.success) {
      const { message, status, code } = mapUseCaseError(result.errorCode);
      return apiError(code, message, status);
    }

    return apiSuccess(
      {
        message: "İlanın kaydedildi ve moderasyon incelemesine gönderildi.",
        listing: {
          id: result.listing!.id,
          slug: result.listing!.slug,
          status: result.listing!.status,
        },
      },
      undefined,
      201
    );
  } finally {
    if (redis) {
      const lockKey = `lock:listing_create:${user.id}`;
      await redis
        .del(lockKey)
        .catch((err) =>
          logger.listings.warn("Failed to release listing create lock", err, { userId: user.id })
        );
    }
  }
}
