import { archiveDatabaseListing } from "@/features/marketplace/services/listing-submissions";
import { bulkListingActionSchema } from "@/features/shared/lib";
import { logger } from "@/features/shared/lib/logger";
import { rateLimitProfiles } from "@/features/shared/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/features/shared/lib/response";
import { withAuthAndCsrf } from "@/features/shared/lib/security";
import { captureServerEvent } from "@/features/shared/lib/telemetry-server";

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

  // Archive each listing individually with bounded concurrency using the
  // version-checked archiveDatabaseListing (OCC) to prevent lost updates.
  const CONCURRENCY = 5;
  const results: Awaited<ReturnType<typeof archiveDatabaseListing>>[] = [];

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((id) => archiveDatabaseListing(id, user.id))
    );

    for (const item of settled) {
      results.push(item.status === "fulfilled" ? item.value : null);
    }
  }

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
