import { captureServerError, trackServerEvent } from "@/lib/monitoring/posthog-server";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { withSecurity, withUserAndCsrf } from "@/lib/utils/api-security";
import {
  createDatabaseListing,
} from "@/services/listings/listing-submissions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { ListingCreateInput } from "@/types/domain";
import { checkListingLimit } from "@/services/listings/listing-limits";
import { parseListingFiltersFromSearchParams } from "@/services/listings/listing-filters";
import { getFilteredMarketplaceListings } from "@/services/listings/marketplace-listings";
import { waitUntil } from "@vercel/functions";
import {
  performAsyncModeration,
  runListingTrustGuards,
} from "@/services/listings/listing-submission-moderation";

export async function GET(request: Request) {
  const security = await withSecurity(request);
  if (!security.ok) return security.response;

  // Rate limit public search — 120 requests per minute per IP
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:listings:search"),
    { limit: 120, windowMs: 60 * 1000 },
  );
  if (ipRateLimit) return ipRateLimit.response;

  const { searchParams } = new URL(request.url);
  
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

  // Orchestrate via Domain Use Case (SOLID)
  const { executeListingCreation } = await import("@/domain/usecases/listing-create-v2");
  
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
      trackServerEvent(AnalyticsEvent.SERVER_LISTING_CREATED, {
        listingId: listing.id,
        brand: listing.brand,
        model: listing.model,
        city: listing.city,
        price: listing.price,
        status: listing.status,
      }, user.id);
    },
    runAsyncModeration: (id) => {
      waitUntil(performAsyncModeration(id));
    }
  });

  if (!result.success) {
    const statusCode = result.errorCode === "VALIDATION_ERROR" ? 400 : 403;
    return apiError(
      (result.errorCode as any) || API_ERROR_CODES.INTERNAL_ERROR, 
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
