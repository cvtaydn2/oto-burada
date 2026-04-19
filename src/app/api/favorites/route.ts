import { hasSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { requireApiUser } from "@/lib/auth/api-user";
import { withAuthAndCsrf } from "@/lib/utils/api-security";
import {
  addDatabaseFavorite,
  getDatabaseFavoriteIds,
  removeDatabaseFavorite,
} from "@/services/favorites/favorite-records";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { getStoredProfileById } from "@/services/profile/profile-records";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getListingIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null || !("listingId" in body)) {
    return "";
  }
  return String((body as Record<string, unknown>).listingId ?? "");
}

export async function GET() {
  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiSuccess({ favoriteIds: [] });
  }

  const userOrError = await requireApiUser();
  if (userOrError instanceof Response) {
    // Unauthenticated — return empty list (favorites are optional for guests)
    return apiSuccess({ favoriteIds: [] });
  }

  // No ensureProfileRecord here — GET should be read-only with no side effects.
  const favoriteIds = (await getDatabaseFavoriteIds(userOrError.id)) ?? [];

  return apiSuccess({ favoriteIds });
}

export async function POST(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: { limit: 60, windowMs: 60 * 1000 },
    userRateLimit: { limit: 30, windowMs: 60 * 1000 },
    rateLimitKey: "favorites:mutate",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Favori isteği okunamadı.", 400);
  }

  const listingId = getListingIdFromBody(body);
  if (!listingId) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçerli bir ilan seçmelisin.", 400);
  }

  const listing = await getStoredListingById(listingId);
  if (!listing) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Favoriye eklenecek ilan bulunamadı.", 404);
  }

  // Only allow favoriting active (approved) listings
  if (listing.status !== "approved") {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Sadece yayındaki ilanlar favorilere eklenebilir.", 400);
  }

  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
  const favoriteIds = await addDatabaseFavorite(user.id, listingId);

  if (!favoriteIds) {
    captureServerError("Favorite add failed", "favorites", null, { userId: user.id, listingId }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Favori eklenemedi.", 500);
  }

  if (listing.sellerId !== user.id) {
    const actorProfile = await getStoredProfileById(user.id);
    await createDatabaseNotification({
      href: `/listing/${listing.slug}`,
      message: `"${listing.title}" ilanını ${actorProfile?.fullName ?? "Bir kullanıcı"} favorilerine ekledi.`,
      title: "İlanın favorilere eklendi",
      type: "favorite",
      userId: listing.sellerId,
    });
  }

  captureServerEvent("favorite_added", {
    userId: user.id,
    listingId,
    sellerId: listing.sellerId,
    listingSlug: listing.slug,
  });

  return apiSuccess({ favoriteIds }, "İlan favorilere eklendi.");
}

export async function DELETE(request: Request) {
  // Security checks: CSRF + Auth
  const security = await withAuthAndCsrf(request);

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Favori isteği okunamadı.", 400);
  }

  const listingId = getListingIdFromBody(body);
  if (!listingId) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçerli bir ilan seçmelisin.", 400);
  }

  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
  const favoriteIds = await removeDatabaseFavorite(user.id, listingId);

  if (!favoriteIds) {
    captureServerError("Favorite remove failed", "favorites", null, { userId: user.id, listingId }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Favori kaldırılamadı.", 500);
  }

  captureServerEvent("favorite_removed", {
    userId: user.id,
    listingId,
  });

  return apiSuccess({ favoriteIds }, "İlan favorilerden kaldırıldı.");
}
