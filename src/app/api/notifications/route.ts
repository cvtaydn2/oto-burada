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
  getStoredNotificationsByUser,
  markAllDatabaseNotificationsRead,
} from "@/services/notifications/notification-records";
import { captureServerError } from "@/lib/monitoring/posthog-server";

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
    getRateLimitKey(request, "api:notifications:list"),
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
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Bildirimleri görmek için giriş yapmalısın.", 401);
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Bildirim servisi hazır değil.", 503);
  }

  await ensureProfileRecord(user);
  const notifications = await getStoredNotificationsByUser(user.id);

  return apiSuccess({ notifications });
}

export async function PATCH(request: Request) {
  const ipRateLimit = await enforceRateLimit(
    getRateLimitKey(request, "api:notifications:mark-all-read"),
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

  const userRateLimit = await enforceRateLimit(
    getUserRateLimitKey(user.id, "notifications:mark-all-read"),
    rateLimitProfiles.general,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Bildirim servisi hazır değil.", 503);
  }

  await ensureProfileRecord(user);
  const updated = await markAllDatabaseNotificationsRead(user.id);

  if (!updated) {
    captureServerError("Mark all notifications read failed", "notifications", null, { userId: user.id }, user.id);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Bildirimler güncellenemedi.", 500);
  }

  return apiSuccess({ updated: true }, "Tum bildirimler okundu olarak isaretlendi.");
}
