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
import { savedSearchCreateSchema } from "@/lib/validators";
import { ensureProfileRecord } from "@/services/profile/profile-records";
import {
  createOrUpdateDatabaseSavedSearch,
  getStoredSavedSearchesByUser,
} from "@/services/saved-searches/saved-search-records";
import { hasMeaningfulSavedSearchFilters } from "@/services/saved-searches/saved-search-utils";

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

export async function GET(request: Request) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:saved-searches:list"),
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
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Kayıtlı aramaları görmek için giriş yapmalısın.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  await ensureProfileRecord(user);
  const savedSearches = await getStoredSavedSearchesByUser(user.id);

  return apiSuccess({ savedSearches });
}

export async function POST(request: Request) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:saved-searches:create"),
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
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Arama kaydetmek için giriş yapmalısın.", 401);
  }

  const userRateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "saved-searches:create"),
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
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Kaydedilecek arama okunamadı.", 400);
  }

  const parsed = savedSearchCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Arama alanlarını kontrol et.",
      400,
      issuesToFieldErrors(parsed.error.issues),
    );
  }

  if (!hasMeaningfulSavedSearchFilters(parsed.data.filters)) {
    return apiError(
      API_ERROR_CODES.BAD_REQUEST,
      "Kayitli arama icin en az bir filtre veya arama kelimesi secmelisin.",
      400,
    );
  }

  await ensureProfileRecord(user);
  const savedSearch = await createOrUpdateDatabaseSavedSearch(user.id, parsed.data);

  if (!savedSearch) {
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Arama kaydedilemedi. Lütfen tekrar dene.", 500);
  }

  return apiSuccess(
    { savedSearch },
    "Araman kaydedildi. Yeni sonuclar geldiginde dashboard'dan takip edebilirsin.",
    201,
  );
}
