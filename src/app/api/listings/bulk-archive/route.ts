import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/utils/api-response";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import { logger } from "@/lib/utils/logger";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { bulkListingActionSchema } from "@/lib/validators";

// Bulk archive: 20 operations per hour per user
const BULK_ARCHIVE_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  const security = await withAuthAndCsrf(req, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: BULK_ARCHIVE_RATE_LIMIT,
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

  const validation = bulkListingActionSchema.safeParse(body);
  if (!validation.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      validation.error.issues[0]?.message || "Doğrulama hatası.",
      400
    );
  }

  const { ids } = validation.data;
  const supabase = await createSupabaseServerClient();

  // Bulk update filtered by seller_id for ownership
  const { error, data } = await supabase
    .from("listings")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)
    .eq("seller_id", user.id)
    .select("id");

  if (error) {
    logger.listings.error("Bulk archive DB error", error, { ids, userId: user.id });
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "İşlem sırasında bir hata oluştu.", 500);
  }

  const affectedCount = data?.length ?? 0;

  logger.listings.info("Bulk archive success", {
    userId: user.id,
    requestedIds: ids,
    affectedCount,
  });

  captureServerEvent(
    "listings_bulk_archived",
    {
      userId: user.id,
      count: affectedCount,
      ids: ids, // Include for audit
    },
    user.id
  );

  return apiSuccess({ count: affectedCount }, `${affectedCount} ilan başarıyla arşive kaldırıldı.`);
}
