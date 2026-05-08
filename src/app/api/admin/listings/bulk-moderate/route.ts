import { waitUntil } from "@vercel/functions";
import { headers } from "next/headers";
import { z } from "zod";

import { moderateListingsWithSideEffects } from "@/features/admin-moderation/services/listing-moderation";
import { rateLimitProfiles } from "@/lib/rate-limit";
import { checkRateLimit } from "@/lib/rate-limit-middleware";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { sanitizeText } from "@/lib/sanitize";
import { withAdminRoute } from "@/lib/security";
import { captureServerError, captureServerEvent } from "@/lib/telemetry-server";

const bulkModerationSchema = z.object({
  action: z.enum(["approve", "reject"]),
  listingIds: z.array(z.string().uuid()).min(1).max(50),
  note: z.string().trim().max(1000).optional(),
});

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function POST(request: Request) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  const clientIp = await getClientIp();
  const ipRateLimit = await checkRateLimit(
    `admin:bulk-moderate:${clientIp}`,
    rateLimitProfiles.adminModerate
  );

  if (!ipRateLimit.allowed) {
    captureServerEvent(
      "admin_bulk_moderation_failed",
      {
        reason: "rate_limited",
        clientIp,
        responseStatus: 429,
      },
      "server"
    );
    return apiError(
      API_ERROR_CODES.RATE_LIMITED,
      "Çok fazla moderasyon isteği. Lütfen bekle.",
      429
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    captureServerEvent(
      "admin_bulk_moderation_failed",
      {
        reason: "invalid_json",
        adminUserId: adminUser.id,
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Moderasyon isteği okunamadı.", 400);
  }

  const parsed = bulkModerationSchema.safeParse(body);

  if (!parsed.success) {
    captureServerEvent(
      "admin_bulk_moderation_failed",
      {
        reason: "invalid_payload",
        adminUserId: adminUser.id,
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz toplu moderasyon isteği.", 400);
  }

  const note = parsed.data.note ? sanitizeText(parsed.data.note) : "";

  if (note.length > 0 && note.length < 3) {
    captureServerEvent(
      "admin_bulk_moderation_failed",
      {
        reason: "invalid_note",
        adminUserId: adminUser.id,
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Moderasyon notu girersen en az 3 karakter olmalı.",
      400
    );
  }

  waitUntil(
    (async () => {
      try {
        await moderateListingsWithSideEffects({
          action: parsed.data.action,
          adminUserId: adminUser.id,
          listingIds: parsed.data.listingIds,
          note,
        });

        captureServerEvent(
          "admin_bulk_moderation_completed",
          {
            adminUserId: adminUser.id,
            action: parsed.data.action,
            attemptedCount: parsed.data.listingIds.length,
          },
          adminUser.id
        );
      } catch (error) {
        captureServerError(
          "Admin bulk moderation failed",
          "admin",
          error,
          {
            adminUserId: adminUser.id,
            action: parsed.data.action,
            listingCount: parsed.data.listingIds.length,
          },
          adminUser.id
        );
      }
    })()
  );

  return apiSuccess(
    {
      action: parsed.data.action,
      moderatedListingIds: parsed.data.listingIds,
      skippedListingIds: [],
    },
    `${parsed.data.listingIds.length} ilan işlenmek üzere sıraya alındı.`
  );
}
