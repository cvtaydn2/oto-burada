import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { deleteDatabaseListing } from "@/services/listings/listing-submissions";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

// Bulk delete: 10 per hour per user
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

  const { ids } = body as { ids?: unknown };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz ID listesi.", 400);
  }

  if (ids.length > 50) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "En fazla 50 ilan silinebilir.", 400);
  }

  const results = await Promise.all(
    ids.map((id) => deleteDatabaseListing(String(id), user.id)),
  );

  const successCount = results.filter(Boolean).length;

  if (successCount === 0 && ids.length > 0) {
    logger.listings.warn("Bulk delete: no listings deleted", { userId: user.id, ids });
    captureServerError("Bulk delete: no listings deleted", "listings", null, { userId: user.id });
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek ilan bulunamadı.", 404);
  }

  captureServerEvent("listings_bulk_deleted", {
    userId: user.id,
    count: successCount,
  }, user.id);

  return apiSuccess(
    { count: successCount },
    `${successCount} ilan başarıyla silindi.`,
  );
}
