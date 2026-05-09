import { logger } from "@/lib/logger";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/rate-limit-middleware";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withUserAndCsrf } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/server";
import { captureServerError, captureServerEvent } from "@/lib/telemetry-server";
import type { ListingStatus } from "@/types";

const BUMP_RATE_LIMIT = { limit: 3, windowMs: 24 * 60 * 60 * 1000 };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "listings:bump",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  const { id: listingId } = await params;
  const supabase = await createSupabaseServerClient();

  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(request, user.id, "api:listings:bump"),
    BUMP_RATE_LIMIT
  );
  if (rateLimit.response) return rateLimit.response;

  try {
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("id, status, seller_id, bumped_at")
      .eq("id", listingId)
      .eq("seller_id", user.id)
      .single();

    if (fetchError || !listing) {
      return apiError(
        API_ERROR_CODES.NOT_FOUND,
        "İlan bulunamadı veya bu işlem için yetkiniz yok.",
        404
      );
    }

    const { bumpListingUseCase } = await import("@/domain/usecases/listing-bump");
    const result = await bumpListingUseCase(listingId, user.id, {
      status: listing.status as ListingStatus,
      bumpedAt: listing.bumped_at,
    });

    if (!result.success) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.error || "İlan yenilenemedi.", 400);
    }

    captureServerEvent(
      "listing_bumped",
      {
        userId: user.id,
        listingId,
      },
      user.id
    );

    return apiSuccess({ listingId }, result.message || "İlan başarıyla öne çıkarıldı.");
  } catch (error) {
    logger.listings.error("Bump listing unexpected error", error, { listingId });
    captureServerError("Bump listing unexpected error", "listings", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Beklenmedik bir hata oluştu.", 500);
  }
}
