import { headers } from "next/headers";

import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAdminRoute } from "@/lib/api/security";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import { checkRateLimit } from "@/lib/rate-limiting/rate-limit-middleware";
import { sanitizeText } from "@/lib/sanitization/sanitize";
import { moderateListingWithSideEffects } from "@/services/admin/listing-moderation";

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const security = await withAdminRoute(request);
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  const { id: listingId } = await context.params;
  const clientIp = await getClientIp();
  const ipRateLimit = await checkRateLimit(
    `admin:moderate:${clientIp}`,
    rateLimitProfiles.adminModerate
  );

  if (!ipRateLimit.allowed) {
    captureServerEvent(
      "admin_listing_moderation_failed",
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
      "admin_listing_moderation_failed",
      {
        reason: "invalid_json",
        adminUserId: adminUser.id,
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Moderasyon isteği okunamadı.", 400);
  }

  const action =
    typeof body === "object" && body !== null && "action" in body ? String(body.action ?? "") : "";
  const rawNote =
    typeof body === "object" && body !== null && "note" in body
      ? String(body.note ?? "").trim()
      : "";
  const note = rawNote ? sanitizeText(rawNote) : "";

  if (action !== "approve" && action !== "reject") {
    captureServerEvent(
      "admin_listing_moderation_failed",
      {
        reason: "invalid_action",
        adminUserId: adminUser.id,
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz moderasyon aksiyonu.", 400);
  }

  if (note.length > 0 && note.length < 3) {
    captureServerEvent(
      "admin_listing_moderation_failed",
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

  let persistedListing;
  try {
    persistedListing = await moderateListingWithSideEffects({
      action,
      adminUserId: adminUser.id,
      listingId,
      note,
    });
  } catch (error) {
    captureServerError(
      "Admin listing moderation failed",
      "admin",
      error,
      {
        adminUserId: adminUser.id,
        action,
        listingId,
      },
      adminUser.id
    );
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Moderasyon işlemi sırasında bir hata oluştu.",
      500
    );
  }

  if (!persistedListing) {
    captureServerEvent(
      "admin_listing_moderation_failed",
      {
        reason: "listing_not_found",
        adminUserId: adminUser.id,
        action,
        listingId,
        responseStatus: 404,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.NOT_FOUND, "İncelenecek ilan bulunamadı.", 404);
  }

  captureServerEvent(
    "admin_listing_moderated",
    {
      adminUserId: adminUser.id,
      action,
      listingId,
      listingStatus: persistedListing.status,
    },
    adminUser.id
  );

  return apiSuccess(
    {
      listing: {
        id: persistedListing.id,
        status: persistedListing.status,
      },
    },
    action === "approve" ? "İlan onaylandı." : "İlan reddedildi."
  );
}
