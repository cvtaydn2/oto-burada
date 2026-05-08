import {
  deleteDatabaseSavedSearch,
  updateDatabaseSavedSearch,
} from "@/features/marketplace/services/saved-search-records";
import { savedSearchUpdateSchema } from "@/features/shared/lib";
import { hasSupabaseAdminEnv } from "@/features/shared/lib/env";
import { issuesToFieldErrors } from "@/features/shared/lib/helpers";
import { rateLimitProfiles } from "@/features/shared/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/features/shared/lib/response";
import { withUserAndCsrf } from "@/features/shared/lib/security";
import { captureServerError, captureServerEvent } from "@/features/shared/lib/telemetry-server";

export async function PATCH(request: Request, context: { params: Promise<{ searchId: string }> }) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "saved-searches:update",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseAdminEnv()) {
    captureServerEvent(
      "saved_search_update_failed",
      {
        userId: user.id,
        reason: "admin_service_unavailable",
        responseStatus: 503,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    captureServerEvent(
      "saved_search_update_failed",
      {
        userId: user.id,
        reason: "invalid_json",
        responseStatus: 400,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Güncelleme isteği okunamadı.", 400);
  }

  const parsed = savedSearchUpdateSchema.safeParse(body);

  if (!parsed.success) {
    captureServerEvent(
      "saved_search_update_failed",
      {
        userId: user.id,
        reason: "validation_error",
        responseStatus: 400,
      },
      user.id
    );
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Alanları kontrol et.",
      400,
      issuesToFieldErrors(parsed.error.issues)
    );
  }

  const { searchId } = await context.params;

  // Profile check - read-only, no side effects
  let savedSearch;
  try {
    savedSearch = await updateDatabaseSavedSearch(user.id, searchId, parsed.data);
  } catch (error) {
    captureServerError(
      "Saved search update failed",
      "saved-searches",
      error,
      {
        userId: user.id,
        searchId,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kayıtlı arama güncellenemedi.", 500);
  }

  if (!savedSearch) {
    captureServerEvent(
      "saved_search_update_failed",
      {
        userId: user.id,
        searchId,
        reason: "search_not_found",
        responseStatus: 404,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.NOT_FOUND, "Güncellenecek kayıtlı arama bulunamadı.", 404);
  }

  captureServerEvent(
    "saved_search_updated",
    {
      userId: user.id,
      searchId,
      notificationsEnabled: savedSearch.notificationsEnabled,
    },
    user.id
  );

  return apiSuccess({ savedSearch }, "Kayıtlı arama güncellendi.");
}

export async function DELETE(request: Request, context: { params: Promise<{ searchId: string }> }) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "saved-searches:delete",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuthAndCsrf

  if (!hasSupabaseAdminEnv()) {
    captureServerEvent(
      "saved_search_delete_failed",
      {
        userId: user.id,
        reason: "admin_service_unavailable",
        responseStatus: 503,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Kayıtlı arama servisi hazır değil.", 503);
  }

  const { searchId } = await context.params;

  // Profile check - read-only, no side effects
  let deleted;
  try {
    deleted = await deleteDatabaseSavedSearch(user.id, searchId);
  } catch (error) {
    captureServerError(
      "Saved search delete failed",
      "saved-searches",
      error,
      {
        userId: user.id,
        searchId,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Kayıtlı arama silinemedi.", 500);
  }

  if (!deleted) {
    captureServerEvent(
      "saved_search_delete_failed",
      {
        userId: user.id,
        searchId,
        reason: "search_not_found",
        responseStatus: 404,
      },
      user.id
    );
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek kayıtlı arama bulunamadı.", 404);
  }

  captureServerEvent(
    "saved_search_deleted",
    {
      userId: user.id,
      searchId,
    },
    user.id
  );

  return apiSuccess({ deleted: true }, "Kayıtlı arama silindi.");
}
