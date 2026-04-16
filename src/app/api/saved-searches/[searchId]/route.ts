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
import { captureServerError, captureServerEvent } from "@/lib/monitoring/posthog-server";

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
    captureServerEvent("saved_search_update_failed", { reason: "service_unavailable", responseStatus: 503 }, "server");
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    captureServerEvent("saved_search_update_failed", { reason: "unauthorized", responseStatus: 401 }, "server");
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
    captureServerEvent("saved_search_update_failed", {
      userId: user.id,
      reason: "admin_service_unavailable",
      responseStatus: 503,
    }, user.id);
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    captureServerEvent("saved_search_update_failed", {
      userId: user.id,
      reason: "invalid_json",
      responseStatus: 400,
    }, user.id);
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Guncelleme istegi okunamadi.", 400);
  }

  const parsed = savedSearchUpdateSchema.safeParse(body);

  if (!parsed.success) {
    captureServerEvent("saved_search_update_failed", {
      userId: user.id,
      reason: "validation_error",
      responseStatus: 400,
    }, user.id);
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Alanlari kontrol et.",
      400,
      issuesToFieldErrors(parsed.error.issues),
    );
  }

  const { searchId } = await context.params;
  await ensureProfileRecord(user);
  let savedSearch;
  try {
    savedSearch = await updateDatabaseSavedSearch(user.id, searchId, parsed.data);
  } catch (error) {
    captureServerError("Saved search update failed", "saved-searches", error, {
      userId: user.id,
      searchId,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kayitli arama guncellenemedi.", 500);
  }

  if (!savedSearch) {
    captureServerEvent("saved_search_update_failed", {
      userId: user.id,
      searchId,
      reason: "search_not_found",
      responseStatus: 404,
    }, user.id);
    return apiError(API_ERROR_CODES.NOT_FOUND, "Guncellenecek kayitli arama bulunamadi.", 404);
  }

  captureServerEvent("saved_search_updated", {
    userId: user.id,
    searchId,
    notificationsEnabled: savedSearch.notificationsEnabled,
  }, user.id);

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
    captureServerEvent("saved_search_delete_failed", { reason: "service_unavailable", responseStatus: 503 }, "server");
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Servis kullanılamıyor.", 503);
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    captureServerEvent("saved_search_delete_failed", { reason: "unauthorized", responseStatus: 401 }, "server");
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Kayitli aramayi silmek icin giris yapmalisin.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    captureServerEvent("saved_search_delete_failed", {
      userId: user.id,
      reason: "admin_service_unavailable",
      responseStatus: 503,
    }, user.id);
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  const { searchId } = await context.params;
  await ensureProfileRecord(user);
  let deleted;
  try {
    deleted = await deleteDatabaseSavedSearch(user.id, searchId);
  } catch (error) {
    captureServerError("Saved search delete failed", "saved-searches", error, {
      userId: user.id,
      searchId,
    }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kayitli arama silinemedi.", 500);
  }

  if (!deleted) {
    captureServerEvent("saved_search_delete_failed", {
      userId: user.id,
      searchId,
      reason: "search_not_found",
      responseStatus: 404,
    }, user.id);
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek kayitli arama bulunamadi.", 404);
  }

  captureServerEvent("saved_search_deleted", {
    userId: user.id,
    searchId,
  }, user.id);

  return apiSuccess({ deleted: true }, "Kayitli arama silindi.");
}
