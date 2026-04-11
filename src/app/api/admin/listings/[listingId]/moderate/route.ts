import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { moderateListingWithSideEffects } from "@/services/admin/listing-moderation";
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
  const ipRateLimit = await checkRateLimit(`admin:moderate:${clientIp}`, rateLimitProfiles.adminModerate);

  if (!ipRateLimit.allowed) {
    return apiError(API_ERROR_CODES.RATE_LIMITED, "Çok fazla moderasyon isteği. Lütfen bekle.", 429);
  }

  const adminUser = await requireApiAdminUser();

  if (adminUser instanceof Response) {
    return adminUser;
  }

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
  const persistedListing = await moderateListingWithSideEffects({
    action,
    adminUserId: adminUser.id,
    listingId,
    note,
  });

  if (!persistedListing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "İncelenecek ilan bulunamadı.", 404);
  }

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
