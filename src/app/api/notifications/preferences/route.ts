import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/utils/api-response";
import { isValidRequestOrigin } from "@/lib/security";
import { z } from "zod";
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "@/services/notifications/notification-preferences";

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

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return apiError(API_ERROR_CODES.UNAUTHORIZED, "Giriş yapmalısın.", 401);

  const prefs = await getNotificationPreferences(user.id);
  return apiSuccess(prefs);
}

export async function PATCH(request: Request) {
  if (!isValidRequestOrigin(request)) {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "Geçersiz istek kaynağı.", 403);
  }

  const user = await getUser();
  if (!user) return apiError(API_ERROR_CODES.UNAUTHORIZED, "Giriş yapmalısın.", 401);

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
