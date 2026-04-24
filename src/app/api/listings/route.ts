import { waitUntil } from "@vercel/functions";

import { AnalyticsEvent } from "@/lib/analytics/events";
import { captureServerError, trackServerEvent } from "@/lib/monitoring/posthog-server";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withSecurity, withUserAndCsrf } from "@/lib/utils/api-security";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { checkListingLimit } from "@/services/listings/listing-limits";
import {
  performAsyncModeration,
  runListingTrustGuards,
} from "@/services/listings/listing-submission-moderation";
import { createDatabaseListing } from "@/services/listings/listing-submissions";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { ListingCreateInput } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "my") {
    const userSecurity = await withSecurity(request, { requireAuth: true });
    if (!userSecurity.ok) return userSecurity.response;
    const user = userSecurity.user!;

    try {
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "50", 10);

      const { getStoredUserListings } = await import("@/services/listings/listing-submissions");
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
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.listingCreate,
    rateLimitKey: "listings:create",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz JSON verisi.", 400);
  }

  // 1. Structural Validation (F-14 Defense in Depth)
  const { listingCreateSchema } = await import("@/lib/validators/listing");
  const validation = listingCreateSchema.partial().safeParse(body);

  if (!validation.success) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz ilan verisi formatı.", 400, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const castBody = validation.data;

  // 2. Bot Protection
  const turnstileToken = String(
    (body as Record<string, unknown>).turnstileToken ||
      (castBody as Record<string, unknown>).turnstileToken ||
      ""
  );
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return apiError(
      API_ERROR_CODES.FORBIDDEN,
      "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
      403
    );
  }

  // Orchestrate via Domain Use Case (SOLID)
  const { executeListingCreation } = await import("@/domain/usecases/listing-create");

  const result = await executeListingCreation(body as Partial<ListingCreateInput>, user.id, {
    checkQuota: (uid) => checkListingLimit(uid),
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
    const errorCode = result.errorCode ?? "INTERNAL_ERROR";
    let statusCode: number;
    switch (errorCode) {
      case "VALIDATION_ERROR":
        statusCode = 400;
        break;
      case "SLUG_COLLISION":
        statusCode = 409;
        break;
      case "QUOTA_EXCEEDED":
      case "TRUST_GUARD_REJECTION":
        statusCode = 403;
        break;
      case "DB_ERROR":
      default:
        statusCode = 500;
        break;
    }
    return apiError(
      (errorCode as keyof typeof API_ERROR_CODES) || API_ERROR_CODES.INTERNAL_ERROR,
      result.error || "İlan oluşturulamadı.",
      statusCode
    );
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
