import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withUserAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";

// Bump: 3 per day per user (prevents abuse)
const BUMP_RATE_LIMIT = { limit: 3, windowMs: 24 * 60 * 60 * 1000 };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "listings:bump",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  const { listingId } = await params;
  const supabase = await createSupabaseServerClient();

  // Rate limit: 3 bumps per day per user
  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "api:listings:bump"),
    BUMP_RATE_LIMIT
  );
  if (rateLimit) return rateLimit.response;

  try {
    // Verify ownership and status
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

    if (listing.status !== "approved") {
      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        "Sadece yayındaki ilanlar öne çıkarılabilir.",
        400
      );
    }

    // Prevent bumping more than once per 24h per listing
    if (listing.bumped_at) {
      const lastBump = new Date(listing.bumped_at).getTime();
      const hoursSinceLastBump = (Date.now() - lastBump) / (1000 * 60 * 60);
      if (hoursSinceLastBump < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceLastBump);
        return apiError(
          API_ERROR_CODES.BAD_REQUEST,
          `Bu ilan ${hoursLeft} saat sonra tekrar öne çıkarılabilir.`,
          400
        );
      }
    }

    const { error } = await supabase
      .from("listings")
      .update({ bumped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", listingId)
      .eq("seller_id", user.id);

    if (error) {
      logger.listings.error("Bump listing DB error", error, { listingId, userId: user.id });
      captureServerError("Bump listing DB error", "listings", error, { listingId });
      return apiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "İlan öne çıkarılırken bir hata oluştu.",
        500
      );
    }

    captureServerEvent(
      "listing_bumped",
      {
        userId: user.id,
        listingId,
      },
      user.id
    );

    return apiSuccess({ listingId }, "İlan başarıyla öne çıkarıldı.");
  } catch (error) {
    logger.listings.error("Bump listing unexpected error", error, { listingId });
    captureServerError("Bump listing unexpected error", "listings", error, { listingId });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Beklenmedik bir hata oluştu.", 500);
  }
}
