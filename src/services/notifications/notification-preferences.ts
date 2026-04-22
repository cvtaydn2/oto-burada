import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";

export interface NotificationPreferences {
  userId: string;
  // In-app
  notifyFavorite: boolean;
  notifyModeration: boolean;
  notifyMessage: boolean;
  notifyPriceDrop: boolean;
  notifySavedSearch: boolean;
  // Email
  emailModeration: boolean;
  emailExpiryWarning: boolean;
  emailSavedSearch: boolean;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "userId"> = {
  notifyFavorite: true,
  notifyModeration: true,
  notifyMessage: true,
  notifyPriceDrop: true,
  notifySavedSearch: true,
  emailModeration: true,
  emailExpiryWarning: true,
  emailSavedSearch: false,
};

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  if (!hasSupabaseAdminEnv()) {
    return { userId, ...DEFAULT_PREFERENCES };
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<{
      user_id: string;
      notify_favorite: boolean;
      notify_moderation: boolean;
      notify_message: boolean;
      notify_price_drop: boolean;
      notify_saved_search: boolean;
      email_moderation: boolean;
      email_expiry_warning: boolean;
      email_saved_search: boolean;
    }>();

  if (!data) {
    return { userId, ...DEFAULT_PREFERENCES };
  }

  return {
    userId: data.user_id,
    notifyFavorite: data.notify_favorite,
    notifyModeration: data.notify_moderation,
    notifyMessage: data.notify_message,
    notifyPriceDrop: data.notify_price_drop,
    notifySavedSearch: data.notify_saved_search,
    emailModeration: data.email_moderation,
    emailExpiryWarning: data.email_expiry_warning,
    emailSavedSearch: data.email_saved_search,
  };
}

export async function upsertNotificationPreferences(
  userId: string,
  prefs: Partial<Omit<NotificationPreferences, "userId">>
): Promise<NotificationPreferences> {
  if (!hasSupabaseAdminEnv()) {
    return { userId, ...DEFAULT_PREFERENCES, ...prefs };
  }

  const admin = createSupabaseAdminClient();
  await admin.from("notification_preferences").upsert(
    {
      user_id: userId,
      notify_favorite: prefs.notifyFavorite ?? DEFAULT_PREFERENCES.notifyFavorite,
      notify_moderation: prefs.notifyModeration ?? DEFAULT_PREFERENCES.notifyModeration,
      notify_message: prefs.notifyMessage ?? DEFAULT_PREFERENCES.notifyMessage,
      notify_price_drop: prefs.notifyPriceDrop ?? DEFAULT_PREFERENCES.notifyPriceDrop,
      notify_saved_search: prefs.notifySavedSearch ?? DEFAULT_PREFERENCES.notifySavedSearch,
      email_moderation: prefs.emailModeration ?? DEFAULT_PREFERENCES.emailModeration,
      email_expiry_warning: prefs.emailExpiryWarning ?? DEFAULT_PREFERENCES.emailExpiryWarning,
      email_saved_search: prefs.emailSavedSearch ?? DEFAULT_PREFERENCES.emailSavedSearch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return getNotificationPreferences(userId);
}
