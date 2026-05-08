import { z } from "zod";

import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "@/features/notifications/services/notification-preferences";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { withUserAndCsrf, withUserRoute } from "@/lib/security";

const prefsSchema = z.object({
  notifyFavorite: z.boolean().optional(),
  notifyModeration: z.boolean().optional(),
  notifyMessage: z.boolean().optional(),
  notifyPriceDrop: z.boolean().optional(),
  notifySavedSearch: z.boolean().optional(),
  emailModeration: z.boolean().optional(),
  emailExpiryWarning: z.boolean().optional(),
  emailSavedSearch: z.boolean().optional(),
});

export async function GET(request: Request) {
  const security = await withUserRoute(request);
  if (!security.ok) return security.response;
  const user = security.user!;

  const prefs = await getNotificationPreferences(user.id);
  return apiSuccess(prefs);
}

export async function PATCH(request: Request) {
  const security = await withUserAndCsrf(request, {
    rateLimitKey: "notifications:preferences",
  });
  if (!security.ok) return security.response;
  const user = security.user!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Geçersiz tercih verisi.", 400);
  }

  const updated = await upsertNotificationPreferences(user.id, parsed.data);
  return apiSuccess(updated, "Bildirim tercihleri güncellendi.");
}
