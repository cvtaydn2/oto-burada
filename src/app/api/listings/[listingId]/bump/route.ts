import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";

const BUMP_COOLDOWN_DAYS = 7;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await params;

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Oturum doğrulanamadı.", 401);
  }

  const rateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "listings:bump"),
    rateLimitProfiles.general,
  );

  if (rateLimit) {
    return rateLimit.response;
  }

  const admin = createSupabaseAdminClient();

  // Fetch listing and verify ownership
  const { data: listing, error: fetchError } = await admin
    .from("listings")
    .select("id, seller_id, status, bumped_at")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "İlan bulunamadı.", 404);
  }

  if (listing.seller_id !== user.id) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Bu ilan size ait değil.", 403);
  }

  if (listing.status !== "approved") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Sadece yayında olan ilanlar yenilenebilir.", 400);
  }

  // Check cooldown
  if (listing.bumped_at) {
    const lastBump = new Date(listing.bumped_at);
    const cooldownEnd = new Date(lastBump.getTime() + BUMP_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now < cooldownEnd) {
      const remainingMs = cooldownEnd.getTime() - now.getTime();
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

      return apiError(
        API_ERROR_CODES.BAD_REQUEST,
        `İlanı yenilemek için ${remainingDays} gün daha beklemelisiniz.`,
        429,
      );
    }
  }

  // Bump the listing
  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("listings")
    .update({
      bumped_at: now,
      updated_at: now,
    })
    .eq("id", listingId);

  if (updateError) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İlan yenilenemedi.", 500);
  }

  return apiSuccess(
    { bumpedAt: now, nextBumpAvailableAt: new Date(Date.now() + BUMP_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString() },
    "İlan başarıyla yenilendi ve listenin üstüne taşındı.",
  );
}
