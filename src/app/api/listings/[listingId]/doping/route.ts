import { getCurrentUser } from "@/lib/auth/session";
import { applyDopingToListing, DopingType } from "@/services/market/doping-service";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";

const VALID_DOPING_TYPES: DopingType[] = ["featured", "urgent", "highlighted"];
// Doping: 10 per day per user
const DOPING_RATE_LIMIT = { limit: 10, windowMs: 24 * 60 * 60 * 1000 };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  // Rate limit
  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:listings:doping"),
    DOPING_RATE_LIMIT,
  );
  if (rateLimit) return rateLimit.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const { dopingTypes } = body as { dopingTypes?: unknown };

  if (!Array.isArray(dopingTypes) || dopingTypes.length === 0) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Lütfen en az bir doping seçin.", 400);
  }

  // Validate doping types
  const invalidTypes = dopingTypes.filter((t) => !VALID_DOPING_TYPES.includes(t as DopingType));
  if (invalidTypes.length > 0) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, `Geçersiz doping türleri: ${invalidTypes.join(", ")}`, 400);
  }

  try {
    const result = await applyDopingToListing(listingId, user.id, dopingTypes as DopingType[]);

    if (result.success) {
      return apiSuccess(null, result.message);
    } else {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.message, 400);
    }
  } catch (error) {
    logger.payments.error("Doping application failed", error, { listingId, userId: user.id });
    captureServerError("Doping application failed", "payments", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
  }
}
