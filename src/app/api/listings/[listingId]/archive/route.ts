import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Yetkisiz erişim.", 401);
  }

  // Rate limit: 20 archive ops per hour per user
  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:listings:archive"),
    { limit: 20, windowMs: 60 * 60 * 1000 },
  );
  if (rateLimit) return rateLimit.response;

  try {
    // Verify ownership before archiving
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("id, status, seller_id")
      .eq("id", listingId)
      .eq("seller_id", user.id)
      .single();

    if (fetchError || !listing) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "İlan bulunamadı veya bu işlem için yetkiniz yok.", 404);
    }

    if (listing.status === "archived") {
      return apiError(API_ERROR_CODES.BAD_REQUEST, "İlan zaten arşivlenmiş.", 400);
    }

    const { error } = await supabase
      .from("listings")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", listingId)
      .eq("seller_id", user.id);

    if (error) {
      logger.listings.error("Archive listing DB error", error, { listingId, userId: user.id });
      captureServerError("Archive listing DB error", "listings", error, { listingId });
      return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan arşivlenirken bir hata oluştu.", 500);
    }

    captureServerEvent("listing_archived", {
      userId: user.id,
      listingId,
    }, user.id);

    return apiSuccess({ listingId }, "İlan başarıyla arşivlendi.");
  } catch (error) {
    logger.listings.error("Archive listing unexpected error", error, { listingId });
    captureServerError("Archive listing unexpected error", "listings", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Beklenmedik bir hata oluştu.", 500);
  }
}
