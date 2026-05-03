import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/api/response";
import { withAuthAndCsrf } from "@/lib/api/security";
import { rateLimitProfiles } from "@/lib/rate-limiting/rate-limit";
import {
  deleteDatabaseNotification,
  markDatabaseNotificationRead,
} from "@/services/notifications/notification-records";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> }
) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:update",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuthAndCsrf

  const { notificationId } = await context.params;
  const notification = await markDatabaseNotificationRead(user.id, notificationId);

  if (!notification) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Güncellenecek bildirim bulunamadı.", 404);
  }

  return apiSuccess({ notification }, "Bildirim okundu olarak işaretlendi.");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ notificationId: string }> }
) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:delete",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withAuthAndCsrf

  const { notificationId } = await context.params;
  const deleted = await deleteDatabaseNotification(user.id, notificationId);

  if (!deleted) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek bildirim bulunamadı.", 404);
  }

  return apiSuccess({ deleted: true }, "Bildirim silindi.");
}
