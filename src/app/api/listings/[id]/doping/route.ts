import { headers } from "next/headers";

import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { getDatabaseListings } from "@/services/listings/listing-submissions";
import { applyDopingToListing, DopingType } from "@/services/market/doping-service";
import { getIyzicoBuyerFromProfile } from "@/services/market/payment-helpers";
import { getUserProfile } from "@/services/profile/profile-records";

const VALID_DOPING_TYPES: DopingType[] = ["featured", "urgent", "highlighted"];
const DOPING_RATE_LIMIT = { limit: 10, windowMs: 24 * 60 * 60 * 1000 };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(req, {
    rateLimitKey: "listings:doping",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  const { id: listingId } = await params;

  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:listings:doping"),
    DOPING_RATE_LIMIT
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

  const invalidTypes = dopingTypes.filter((t) => !VALID_DOPING_TYPES.includes(t as DopingType));
  if (invalidTypes.length > 0) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      `Geçersiz doping türleri: ${invalidTypes.join(", ")}`,
      400
    );
  }

  try {
    const listing = (
      await getDatabaseListings({
        listingId,
        sellerId: user.id,
      })
    )?.[0];

    if (!listing || listing.status === "archived") {
      return apiError(API_ERROR_CODES.NOT_FOUND, "Doping uygulanabilir ilan bulunamadı.", 404);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || !user.email) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "Profil bilgileri bulunamadı.", 400);
    }

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    let buyer;
    try {
      buyer = getIyzicoBuyerFromProfile(profile, user.email, ip);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Eksik profil bilgileri.";
      return apiError(API_ERROR_CODES.BAD_REQUEST, message, 400);
    }

    const result = await applyDopingToListing(
      listingId,
      user.id,
      dopingTypes as DopingType[],
      buyer
    );

    if (result.success) {
      captureServerEvent(
        "listing_doping_applied",
        {
          userId: user.id,
          listingId,
          dopingTypes,
        },
        user.id
      );
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
