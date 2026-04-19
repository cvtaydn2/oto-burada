import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

// Bulk draft: 20 per hour per user
const BULK_DRAFT_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  const security = await withAuthAndCsrf(req, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: BULK_DRAFT_RATE_LIMIT,
    rateLimitKey: "listings:bulk-draft",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const { ids } = body as { ids?: unknown };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz ID listesi.", 400);
  }

  if (ids.length > 50) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "En fazla 50 ilan taslağa çekilebilir.", 400);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("listings")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .in("id", ids.map(String))
    .eq("seller_id", user.id);

  if (error) {
    logger.listings.error("Bulk draft DB error", error, { userId: user.id, count: ids.length });
    captureServerError("Bulk draft DB error", "listings", error, { userId: user.id });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
  }

  captureServerEvent("listings_bulk_drafted", {
    userId: user.id,
    count: ids.length,
  }, user.id);

  return apiSuccess({ count: ids.length }, "İlanlar taslağa çekildi.");
}
