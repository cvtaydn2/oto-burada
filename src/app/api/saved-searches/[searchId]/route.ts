import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { apiError, API_ERROR_CODES, apiSuccess } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/utils/rate-limit-middleware";
import { issuesToFieldErrors } from "@/lib/utils/validation-helpers";
import { savedSearchUpdateSchema } from "@/lib/validators";
import { ensureProfileRecord } from "@/services/profile/profile-records";
import {
  deleteDatabaseSavedSearch,
  updateDatabaseSavedSearch,
} from "@/services/saved-searches/saved-search-records";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ searchId: string }> },
) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:saved-searches:update"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Kayitli aramayi guncellemek icin giris yapmalisin.", 401);
  }

  const userRateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "saved-searches:update"),
    rateLimitProfiles.general,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Guncelleme istegi okunamadi.", 400);
  }

  const parsed = savedSearchUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Alanlari kontrol et.",
      400,
      issuesToFieldErrors(parsed.error.issues),
    );
  }

  const { searchId } = await context.params;
  await ensureProfileRecord(user);
  const savedSearch = await updateDatabaseSavedSearch(user.id, searchId, parsed.data);

  if (!savedSearch) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Guncellenecek kayitli arama bulunamadi.", 404);
  }

  return apiSuccess({ savedSearch }, "Kayitli arama guncellendi.");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ searchId: string }> },
) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:saved-searches:delete"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Kayitli aramayi silmek icin giris yapmalisin.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  const { searchId } = await context.params;
  await ensureProfileRecord(user);
  const deleted = await deleteDatabaseSavedSearch(user.id, searchId);

  if (!deleted) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek kayitli arama bulunamadi.", 404);
  }

  return apiSuccess({ deleted: true }, "Kayitli arama silindi.");
}
