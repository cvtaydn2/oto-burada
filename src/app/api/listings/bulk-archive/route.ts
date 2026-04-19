import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";

export async function POST(req: Request) {
  const security = await withAuthAndCsrf(req, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "listings:bulk-archive",
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

  if (!Array.isArray(ids) || ids.length === 0) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz ilan listesi.", 400);
  }

  if (ids.length > 50) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "En fazla 50 ilan arşivlenebilir.", 400);
  }

  const supabase = await createSupabaseServerClient();

  // Bulk update filtered by seller_id for security (RLS also enforces this)
  const { error } = await supabase
    .from("listings")
    .update({ status: "archived" })
    .in("id", ids.map(String))
    .eq("seller_id", user.id);

  if (error) {
    logger.listings.error("Bulk archive DB error", error, { ids, userId: user.id });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
  }

  captureServerEvent("listings_bulk_archived", {
    userId: user.id,
    count: ids.length,
  }, user.id);

  return apiSuccess({ count: ids.length }, `${ids.length} ilan başarıyla arşive kaldırıldı.`);
}
