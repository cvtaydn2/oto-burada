import { headers } from "next/headers";
import { z } from "zod";

import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { apiError, API_ERROR_CODES, apiSuccess } from "@/lib/utils/api-response";
import { checkRateLimit } from "@/lib/utils/rate-limit-middleware";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { sanitizeText } from "@/lib/utils/sanitize";
import { moderateListingsWithSideEffects } from "@/services/admin/listing-moderation";

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
  const clientIp = await getClientIp();
  const ipRateLimit = await checkRateLimit(`admin:bulk-moderate:${clientIp}`, rateLimitProfiles.adminModerate);

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

  const parsed = bulkModerationSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz toplu moderasyon isteği.", 400);
  }

  const note = parsed.data.note ? sanitizeText(parsed.data.note) : "";

  if (note.length > 0 && note.length < 3) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Moderasyon notu girersen en az 3 karakter olmalı.", 400);
  }

  const result = await moderateListingsWithSideEffects({
    action: parsed.data.action,
    adminUserId: adminUser.id,
    listingIds: parsed.data.listingIds,
    note,
  });

  if (result.moderatedListings.length === 0) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Toplu moderasyon için uygun bekleyen ilan bulunamadı.", 404);
  }

  return apiSuccess(
    {
      action: parsed.data.action,
      moderatedListingIds: result.moderatedListings.map((listing) => listing.id),
      skippedListingIds: result.skippedListingIds,
    },
    parsed.data.action === "approve"
      ? `${result.moderatedListings.length} ilan onaylandı.`
      : `${result.moderatedListings.length} ilan reddedildi.`,
  );
}
