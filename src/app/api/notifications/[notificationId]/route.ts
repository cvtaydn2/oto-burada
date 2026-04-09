import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { apiError, API_ERROR_CODES, apiSuccess } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import {
  enforceRateLimit,
  getRateLimitKey,
  getUserRateLimitKey,
} from "@/lib/utils/rate-limit-middleware";
import { ensureProfileRecord } from "@/services/profile/profile-records";
import {
  deleteDatabaseNotification,
  markDatabaseNotificationRead,
} from "@/services/notifications/notification-records";

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
  context: { params: Promise<{ notificationId: string }> },
) {
  const ipRateLimit = enforceRateLimit(
    getRateLimitKey(request, "api:notifications:update"),
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
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Bildirimleri güncellemek için giriş yapmalısın.", 401);
  }

  const userRateLimit = enforceRateLimit(
    getUserRateLimitKey(user.id, "notifications:update"),
    rateLimitProfiles.general,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Bildirim servisi hazır değil.", 503);
  }

  const { notificationId } = await context.params;
  await ensureProfileRecord(user);
  const notification = await markDatabaseNotificationRead(user.id, notificationId);

  if (!notification) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Guncellenecek bildirim bulunamadi.", 404);
  }

  return apiSuccess({ notification }, "Bildirim okundu olarak isaretlendi.");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  const ipRateLimit = enforceRateLimit(
    getRateLimitKey(request, "api:notifications:delete"),
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
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Bildirimleri silmek için giriş yapmalısın.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Bildirim servisi hazır değil.", 503);
  }

  const { notificationId } = await context.params;
  await ensureProfileRecord(user);
  const deleted = await deleteDatabaseNotification(user.id, notificationId);

  if (!deleted) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek bildirim bulunamadi.", 404);
  }

  return apiSuccess({ deleted: true }, "Bildirim silindi.");
}
