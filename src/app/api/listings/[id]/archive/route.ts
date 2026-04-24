import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import type { ListingStatus } from "@/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "listings:archive",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  const { id: listingId } = await params;
  const supabase = await createSupabaseServerClient();

  const rateLimit = await enforceRateLimit(getUserRateLimitKey(user.id, "api:listings:archive"), {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimit) return rateLimit.response;

  try {
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("id, status, seller_id")
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

    const { archiveListingUseCase } = await import("@/domain/usecases/listing-archive");
    const result = await archiveListingUseCase(listingId, user.id, listing.status as ListingStatus);

    if (!result.success) {
      return apiError(API_ERROR_CODES.BAD_REQUEST, result.error || "İlan arşivlenemedi.", 400);
    }

    captureServerEvent(
      "listing_archived",
      {
        userId: user.id,
        listingId,
      },
      user.id
    );

    return apiSuccess({ listingId }, "İlan başarıyla arşivlendi.");
  } catch (error) {
    logger.listings.error("Archive listing unexpected error", error, { listingId });
    captureServerError("Archive listing unexpected error", "listings", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Beklenmedik bir hata oluştu.", 500);
  }
}
