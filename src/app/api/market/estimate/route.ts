import { captureServerError } from "@/lib/monitoring/posthog-server";
import { getCachedData, setCachedData } from "@/lib/redis/client";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { enforceRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { estimateVehiclePrice } from "@/services/market/price-estimation";

// Rate limit: 30 per minute per IP
const ESTIMATE_RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 };

export async function GET(request: Request) {
  const rateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:market:estimate"),
    ESTIMATE_RATE_LIMIT
  );
  if (rateLimit) return rateLimit.response;

  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand");
  const model = searchParams.get("model");
  const year = Number(searchParams.get("year"));
  const mileage = Number(searchParams.get("mileage"));

  if (!brand || !model || !year || isNaN(mileage)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Eksik araç bilgileri.", 400);
  }

  // Cache key for this specific estimate
  const cacheKey = `market:estimate:${brand}:${model}:${year}:${Math.floor(mileage / 10000) * 10000}`;

  try {
    // Check cache first (5 min TTL)
    const cached = await getCachedData<Awaited<ReturnType<typeof estimateVehiclePrice>>>(cacheKey);
    if (cached) return apiSuccess(cached);

    const result = await estimateVehiclePrice({ brand, model, year, mileage });

    if (!result) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        "Bu araç segmenti için yeterli veri bulunamadı.",
        404
      );
    }

    // Cache result for 5 minutes
    await setCachedData(cacheKey, result, 300);

    return apiSuccess(result);
  } catch (error) {
    logger.market.error("Price estimation failed", error, { brand, model, year });
    captureServerError("Price estimation failed", "market", error, { brand, model, year });
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Fiyat tahmini hesaplanırken bir hata oluştu.",
      500
    );
  }
}
