import { getCurrentUser } from "@/lib/auth/session";
import { applyDopingToListing, DopingType } from "@/services/market/doping-service";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { getUserProfile } from "@/services/profile/profile-records";
import { headers } from "next/headers";

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
    const profile = await getUserProfile(user.id);
    if (!profile || !profile.fullName || !user.email) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Ödeme için profil bilgileriniz (isim, e-posta) eksik.", 400);
    }

    const nameParts = profile.fullName.trim().split(" ");
    const name = nameParts[0] || "User";
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Kullanıcı";
    
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    const result = await applyDopingToListing(listingId, user.id, dopingTypes as DopingType[], {
      id: user.id,
      name,
      surname,
      email: user.email,
      gsmNumber: profile.phone || "+905320000000",
      address: profile.businessAddress || "Türkiye",
      city: profile.city || "Istanbul",
      country: "Turkey",
      zipCode: "34000",
      ip,
      registrationDate: new Date(profile.createdAt).toISOString().slice(0, 19).replace('T', ' '),
      lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    if (result.success) {
      captureServerEvent("listing_doping_applied", {
        userId: user.id,
        listingId,
        dopingTypes,
      }, user.id);
      return apiSuccess(result, result.message);
    } else {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.message, 400);
    }
  } catch (error) {
    logger.payments.error("Doping application failed", error, { listingId, userId: user.id });
    captureServerError("Doping application failed", "payments", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
  }
}
