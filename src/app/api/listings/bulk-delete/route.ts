import { deleteDatabaseListing } from "@/features/marketplace/services/listing-submissions";
import { bulkListingActionSchema } from "@/lib";
import { logger } from "@/lib/logger";
import { rateLimitProfiles } from "@/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withAuthAndCsrf } from "@/lib/security";
import { captureServerEvent } from "@/lib/telemetry-server";

// Bulk delete: 10 operations per hour per user (stricter due to side effects)
const BULK_DELETE_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  const security = await withAuthAndCsrf(req, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: BULK_DELETE_RATE_LIMIT,
    rateLimitKey: "listings:bulk-delete",
    requireStepUp: true,
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

  // Process deletions with bounded concurrency to prevent burst load.
  const CONCURRENCY = 5;
  const results: Awaited<ReturnType<typeof deleteDatabaseListing>>[] = [];

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map((id) => deleteDatabaseListing(id, user.id)));

    for (const item of settled) {
      results.push(item.status === "fulfilled" ? item.value : null);
    }
  }

  // Count only genuine successes — null means not found/not archived,
  // { error } means a conflict or DB failure (truthy but not a success).
  const successCount = results.filter(
    (r): r is { id: string; deleted: true } =>
      r !== null && typeof r === "object" && "deleted" in r && r.deleted === true
  ).length;

  logger.listings.info("Bulk delete attempt", {
    userId: user.id,
    requestedIds: ids,
    successCount,
  });

  if (successCount === 0 && ids.length > 0) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinebilir (arşivlenmiş) ilan bulunamadı.", 404);
  }

  captureServerEvent(
    "listings_bulk_deleted",
    {
      userId: user.id,
      count: successCount,
      requestedIds: ids,
    },
    user.id
  );

  return apiSuccess({ count: successCount }, `${successCount} ilan başarıyla silindi.`);
}
