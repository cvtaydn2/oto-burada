import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { apiError, API_ERROR_CODES, apiSuccess } from "@/lib/utils/api-response";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import {
  deleteDatabaseNotification,
  markDatabaseNotificationRead,
} from "@/services/notifications/notification-records";
import { withAuth } from "@/lib/utils/api-security";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:update",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuth

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Bildirim servisi hazır değil.", 503);
  }

  const { notificationId } = await context.params;
  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
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
  // Security checks: Auth + Rate limiting
  const security = await withAuth(request, {
    ipRateLimit: rateLimitProfiles.general,
    rateLimitKey: "notifications:delete",
  });

  if (!security.ok) return security.response;
  
  const user = security.user!; // Guaranteed by withAuth

  if (!hasSupabaseAdminEnv()) {
    return apiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, "Bildirim servisi hazır değil.", 503);
  }

  const { notificationId } = await context.params;
  // P1 Security: Removed ensureProfileRecord() - no side effects in mutations
  const deleted = await deleteDatabaseNotification(user.id, notificationId);

  if (!deleted) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Silinecek bildirim bulunamadi.", 404);
  }

  return apiSuccess({ deleted: true }, "Bildirim silindi.");
}
