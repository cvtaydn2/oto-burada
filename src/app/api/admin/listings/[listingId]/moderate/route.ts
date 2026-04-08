import { requireAdminUser } from "@/lib/auth/session";
import { createAdminModerationAction } from "@/services/admin/moderation-actions";
import {
  moderateDatabaseListing,
} from "@/services/listings/listing-submissions";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { checkRateLimit } from "@/lib/utils/rate-limit-middleware";
import { headers } from "next/headers";
import { sanitizeText } from "@/lib/utils/sanitize";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";

async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const clientIp = await getClientIp();
  const ipRateLimit = checkRateLimit(`admin:moderate:${clientIp}`, rateLimitProfiles.adminModerate);

  if (!ipRateLimit.allowed) {
    return apiError(API_ERROR_CODES.RATE_LIMITED, "Çok fazla moderasyon isteği. Lütfen bekle.", 429);
  }

  const adminUser = await requireAdminUser();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Moderasyon isteği okunamadı.", 400);
  }

  const action =
    typeof body === "object" && body !== null && "action" in body ? String(body.action ?? "") : "";
  const rawNote =
    typeof body === "object" && body !== null && "note" in body ? String(body.note ?? "").trim() : "";
  const note = rawNote ? sanitizeText(rawNote) : "";

  if (action !== "approve" && action !== "reject") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz moderasyon aksiyonu.", 400);
  }

  if (note.length > 0 && note.length < 3) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Moderasyon notu girersen en az 3 karakter olmalı.", 400);
  }

  const { listingId } = await context.params;
  const persistedListing = await moderateDatabaseListing(
    listingId,
    action === "approve" ? "approved" : "rejected",
  );

  if (!persistedListing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "İncelenecek ilan bulunamadı.", 404);
  }

  await createAdminModerationAction({
    action: action === "approve" ? "approve" : "reject",
    adminUserId: adminUser.id,
    note:
      note ||
      (action === "approve"
        ? `${persistedListing.title} ilanı onaylandı.`
        : `${persistedListing.title} ilanı reddedildi.`),
    targetId: persistedListing.id,
    targetType: "listing",
  });

  return apiSuccess(
    {
      listing: {
        id: persistedListing.id,
        status: persistedListing.status,
      },
    },
    action === "approve" ? "İlan onaylandı." : "İlan reddedildi.",
  );
}
