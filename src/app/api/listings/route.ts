import { waitUntil } from "@vercel/functions";

import { executeListingCreation } from "@/domain/usecases/listing-create";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { mapUseCaseError, validateRequestBody } from "@/lib/api/handler-utils";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withSecurity, withUserAndCsrfToken } from "@/lib/api/security";
import { captureServerError, trackServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/rate-limiting/rate-limit-middleware";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { listingCreateSchema } from "@/lib/validators/listing";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { checkListingLimit } from "@/services/listings/listing-limits";
import {
  performAsyncModeration,
  runListingTrustGuards,
} from "@/services/listings/listing-submission-moderation";
import {
  createDatabaseListing,
  getDatabaseListings,
  getStoredUserListings,
} from "@/services/listings/listing-submissions";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";
import { createDatabaseNotification } from "@/services/notifications/notification-records";

const MY_LISTINGS_DEFAULT_LIMIT = 50;
const MY_LISTINGS_MAX_LIMIT = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "my") {
    const userSecurity = await withSecurity(request, { requireAuth: true });
    if (!userSecurity.ok) return userSecurity.response;
    const user = userSecurity.user!;

    try {
      const rawPage = parseInt(searchParams.get("page") || "1", 10);
      const rawLimit = parseInt(searchParams.get("limit") || String(MY_LISTINGS_DEFAULT_LIMIT), 10);
      const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
      const limit = Number.isFinite(rawLimit)
        ? Math.min(Math.max(rawLimit, 1), MY_LISTINGS_MAX_LIMIT)
        : MY_LISTINGS_DEFAULT_LIMIT;

      const result = await getStoredUserListings(user.id, page, limit);
      return apiSuccess(result);
    } catch (error) {
      captureServerError("GET /api/listings?view=my failed", "listings", error, {
        userId: user.id,
      });
      return apiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "İlanların yüklenirken bir hata oluştu.",
        500
      );
    }
  }

  // Rate limit public search — 120 requests per minute per IP
  const ipRateLimit = await enforceRateLimit(getRateLimitKey(request, "api:listings:search"), {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (ipRateLimit) return ipRateLimit.response;

  // Convert URLSearchParams to a key-value object
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
  });

  const filters = parseListingFiltersFromSearchParams(paramsObj);

  try {
    const result = await getFilteredMarketplaceListings(filters);
    return apiSuccess(result);
  } catch (error) {
    captureServerError("GET /api/listings failed", "listings", error, { filters: paramsObj });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlanlar yüklenirken bir hata oluştu.", 500);
  }
}

export async function POST(request: Request) {
  const security = await withUserAndCsrfToken(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.listingCreate,
    rateLimitKey: "listings:create",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

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
      "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
      403
    );
  }

  // Orchestrate via Domain Use Case (SOLID)
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
    runAsyncModeration: (id) => {
      waitUntil(performAsyncModeration(id));
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
}
