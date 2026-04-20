import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { deleteDatabaseListing } from "@/services/listings/listing-submissions";
import { logger } from "@/lib/utils/logger";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { bulkListingActionSchema } from "@/lib/validators";

// Bulk delete: 10 operations per hour per user (stricter due to side effects)
const BULK_DELETE_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  const security = await withAuthAndCsrf(req, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: BULK_DELETE_RATE_LIMIT,
    rateLimitKey: "listings:bulk-delete",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const validation = bulkListingActionSchema.safeParse(body);
  if (!validation.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      validation.error.issues[0]?.message || "Doğrulama hatası.",
      400
    );
  }

  const { ids } = validation.data;

  // Process deletions (deleteDatabaseListing handles ownership and image cleanup)
  const results = await Promise.all(
    ids.map((id) => deleteDatabaseListing(id, user.id))
  );

  const successCount = results.filter(Boolean).length;

  logger.listings.info("Bulk delete attempt", { 
    userId: user.id, 
    requestedIds: ids, 
    successCount 
  });

  if (successCount === 0 && ids.length > 0) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinebilir (arşivlenmiş) ilan bulunamadı.", 404);
  }

  captureServerEvent("listings_bulk_deleted", {
    userId: user.id,
    count: successCount,
    requestedIds: ids
  }, user.id);

  return apiSuccess(
    { count: successCount },
    `${successCount} ilan başarıyla silindi.`
  );
}
