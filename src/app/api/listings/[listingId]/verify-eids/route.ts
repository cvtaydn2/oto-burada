import { getCurrentUser } from "@/lib/auth/session";
import { verifyListingWithEIDS } from "@/services/verification/eids-mock";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";

// EIDS verification: 5 per hour per user (expensive operation)
const EIDS_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim. Lütfen giriş yapın.", 401);
  }

  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:listings:verify-eids"),
    EIDS_RATE_LIMIT,
  );
  if (rateLimit) return rateLimit.response;

  try {
    const result = await verifyListingWithEIDS(listingId, user.id);

    if (result.success) {
      return apiSuccess(result.data, result.message);
    } else {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.message, 400);
    }
  } catch (error) {
    logger.auth.error("EIDS verification failed", error, { listingId, userId: user.id });
    captureServerError("EIDS verification failed", "auth", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Doğrulama işlemi sırasında bir hata oluştu.", 500);
  }
}
