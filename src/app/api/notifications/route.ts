import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAuth, withAuthAndCsrf } from "@/lib/api/security";
import { captureServerError } from "@/lib/monitoring/posthog-server";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import {
  getStoredNotificationsByUser,
  markAllDatabaseNotificationsRead,
} from "@/services/notifications/notification-records";

export async function GET(request: Request) {
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:list",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuth

  // P1 Security: Removed ensureProfileRecord() - GET should be read-only
  const notifications = await getStoredNotificationsByUser(user.id);

  return apiSuccess({ notifications });
}

export async function PATCH(request: Request) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:mark-all-read",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuthAndCsrf

  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
  const updated = await markAllDatabaseNotificationsRead(user.id);

  if (!updated) {
    captureServerError(
      "Mark all notifications read failed",
      "notifications",
      null,
      { userId: user.id },
      user.id
    );
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, "Bildirimler güncellenemedi.", 500);
  }

  return apiSuccess({ updated: true }, "Tum bildirimler okundu olarak isaretlendi.");
}
