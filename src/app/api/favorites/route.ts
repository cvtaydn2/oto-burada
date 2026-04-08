import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/utils/api-response";
import {
  addDatabaseFavorite,
  getDatabaseFavoriteIds,
  removeDatabaseFavorite,
} from "@/services/favorites/favorite-records";
import { checkListingExistsById } from "@/services/listings/listing-submissions";
import { ensureProfileRecord } from "@/services/profile/profile-records";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getListingIdFromBody(body: unknown) {
  if (typeof body !== "object" || body === null || !("listingId" in body)) {
    return "";
  }

  return String(body.listingId ?? "");
}

async function getAuthenticatedUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET() {
  if (!hasSupabaseEnv()) {
    return apiSuccess({ favoriteIds: [] });
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return apiSuccess({ favoriteIds: [] });
  }

  if (!hasSupabaseAdminEnv()) {
    return apiSuccess({ favoriteIds: [] });
  }

  await ensureProfileRecord(user);
  const favoriteIds = (await getDatabaseFavoriteIds(user.id)) ?? [];

  return apiSuccess({ favoriteIds });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Favori eklemek için giriş yapmalısın.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
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

  const listingExists = await checkListingExistsById(listingId);

  if (!listingExists) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Favoriye eklenecek ilan bulunamadı.", 404);
  }

  await ensureProfileRecord(user);
  const favoriteIds = await addDatabaseFavorite(user.id, listingId);

  if (!favoriteIds) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Favori eklenemedi.", 500);
  }

  return apiSuccess({ favoriteIds }, "İlan favorilere eklendi.");
}

export async function DELETE(request: Request) {
  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Favori güncellemek için giriş yapmalısın.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
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

  await ensureProfileRecord(user);
  const favoriteIds = await removeDatabaseFavorite(user.id, listingId);

  if (!favoriteIds) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Favori kaldırılamadı.", 500);
  }

  return apiSuccess({ favoriteIds }, "İlan favorilerden kaldırıldı.");
}
