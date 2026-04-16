import { hasSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import { requireApiUser } from "@/lib/auth/api-user";
import { isValidRequestOrigin } from "@/lib/security";
import {
  addDatabaseFavorite,
  getDatabaseFavoriteIds,
  removeDatabaseFavorite,
} from "@/services/favorites/favorite-records";
import { getStoredListingById } from "@/services/listings/listing-submissions";
import { createDatabaseNotification } from "@/services/notifications/notification-records";
import { ensureProfileRecord, getStoredProfileById } from "@/services/profile/profile-records";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getListingIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null || !("listingId" in body)) {
    return "";
  }
  return String((body as Record<string, unknown>).listingId ?? "");
}

function checkCsrf(request: Request): boolean {
  return isValidRequestOrigin(request);
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

  await ensureProfileRecord(userOrError);
  const favoriteIds = (await getDatabaseFavoriteIds(userOrError.id)) ?? [];

  return apiSuccess({ favoriteIds });
}

export async function POST(request: Request) {
  if (!checkCsrf(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const userOrError = await requireApiUser();
  if (userOrError instanceof Response) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Favori eklemek için giriş yapmalısın.", 401);
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

  await ensureProfileRecord(userOrError);
  const favoriteIds = await addDatabaseFavorite(userOrError.id, listingId);

  if (!favoriteIds) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Favori eklenemedi.", 500);
  }

  if (listing.sellerId !== userOrError.id) {
    const actorProfile = await getStoredProfileById(userOrError.id);
    await createDatabaseNotification({
      href: `/listing/${listing.slug}`,
      message: `"${listing.title}" ilanını ${actorProfile?.fullName ?? "Bir kullanıcı"} favorilerine ekledi.`,
      title: "İlanın favorilere eklendi",
      type: "favorite",
      userId: listing.sellerId,
    });
  }

  captureServerEvent("favorite_added", {
    userId: userOrError.id,
    listingId,
    sellerId: listing.sellerId,
    listingSlug: listing.slug,
  });

  return apiSuccess({ favoriteIds }, "İlan favorilere eklendi.");
}

export async function DELETE(request: Request) {
  if (!checkCsrf(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  if (!hasSupabaseEnv() || !hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const userOrError = await requireApiUser();
  if (userOrError instanceof Response) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Favori güncellemek için giriş yapmalısın.", 401);
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

  await ensureProfileRecord(userOrError);
  const favoriteIds = await removeDatabaseFavorite(userOrError.id, listingId);

  if (!favoriteIds) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Favori kaldırılamadı.", 500);
  }

  captureServerEvent("favorite_removed", {
    userId: userOrError.id,
    listingId,
  });

  return apiSuccess({ favoriteIds }, "İlan favorilerden kaldırıldı.");
}
