import { moderateListingWithSideEffects } from "@/features/admin-moderation/services/listing-moderation";
import { rateLimitProfiles } from "@/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { sanitizeText } from "@/lib/sanitize";
import { withAdminRoute } from "@/lib/security";
import { captureServerError, captureServerEvent } from "@/lib/telemetry-server";
import { listingModerationDecisionSchema } from "@/lib/validators/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const security = await withAdminRoute(request, {
    ipRateLimit: rateLimitProfiles.adminModerate,
    rateLimitKey: "admin:moderate",
  });
  if (!security.ok) return security.response;
  const adminUser = security.user!;

  const { id: listingId } = await context.params;

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

  const parsed = listingModerationDecisionSchema.safeParse(body);

  if (!parsed.success) {
    captureServerEvent(
      "admin_listing_moderation_failed",
      {
        reason: "invalid_payload",
        adminUserId: adminUser.id,
        responseStatus: 400,
      },
      adminUser.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz moderasyon isteği.", 400);
  }

  const action = parsed.data.action;
  const rejectReason =
    action === "reject" && parsed.data.rejectReason
      ? {
          reasonCode: parsed.data.rejectReason.reasonCode,
          moderatorNote: parsed.data.rejectReason.moderatorNote
            ? sanitizeText(parsed.data.rejectReason.moderatorNote)
            : undefined,
        }
      : undefined;

  let persistedListing;
  try {
    persistedListing = await moderateListingWithSideEffects({
      action,
      adminUserId: adminUser.id,
      listingId,
      rejectReason,
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
    action === "approve" ? "İlan onaylandı." : "İlan standart red nedeni ile reddedildi."
  );
}
