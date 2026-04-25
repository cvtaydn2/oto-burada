import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAuthAndCsrf } from "@/lib/api/security";
import { logger } from "@/lib/logging/logger";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { bulkListingActionSchema } from "@/lib/validators";
import { archiveDatabaseListing } from "@/services/listings/listing-submissions";

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

  // Archive each listing individually using the version-checked archiveDatabaseListing,
  // which applies optimistic concurrency control (OCC) to prevent lost updates.
  const results = await Promise.all(ids.map((id) => archiveDatabaseListing(id, user.id)));

  const affectedCount = results.filter(
    (r): r is { data: NonNullable<typeof r extends { data: infer D } ? D : never> } =>
      r !== null && typeof r === "object" && !("error" in r)
  ).length;

  const conflictCount = results.filter(
    (r) => r !== null && typeof r === "object" && "error" in r && r.error === "CONFLICT"
  ).length;

  logger.listings.info("Bulk archive success", {
    userId: user.id,
    requestedIds: ids,
    affectedCount,
    conflictCount,
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

  return apiSuccess(
    { count: affectedCount, conflictCount },
    `${affectedCount} ilan başarıyla arşive kaldırıldı.`
  );
}
