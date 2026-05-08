import {
  deleteDatabaseNotification,
  markDatabaseNotificationRead,
} from "@/features/notifications/services/notification-records";
import { rateLimitProfiles } from "@/features/shared/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/features/shared/lib/response";
import { withUserAndCsrf } from "@/features/shared/lib/security";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> }
) {
  // Security checks: CSRF + Auth + Rate limiting
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:update",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withUserAndCsrf

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
  const security = await withUserAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:delete",
  });

  if (!security.ok) return security.response;

  const user = security.user!; // Guaranteed by withUserAndCsrf

  const { notificationId } = await context.params;
  const deleted = await deleteDatabaseNotification(user.id, notificationId);

  if (!deleted) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek bildirim bulunamadı.", 404);
  }

  return apiSuccess({ deleted: true }, "Bildirim silindi.");
}
