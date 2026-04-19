import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { notificationSchema } from "@/lib/validators";
import type { NotificationType } from "@/types";

interface NotificationRow {
  created_at: string;
  href: string | null;
  id: string;
  message: string;
  read: boolean;
  title: string;
  type: NotificationType;
  updated_at: string;
  user_id: string;
}

function mapNotificationRow(row: NotificationRow) {
  return notificationSchema.parse({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    href: row.href,
    read: row.read,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

/**
 * Internal helper for fetching notifications.
 * Uses server client (authenticated role) to enforce RLS.
 * RLS policy: notifications_manage_own ensures user can only access their own notifications.
 */
async function getDatabaseNotifications(options?: {
  notificationId?: string;
  userId?: string;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("notifications")
    .select("id, user_id, type, title, message, href, read, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.notificationId) {
    query = query.eq("id", options.notificationId);
  }

  const { data, error } = await query.returns<NotificationRow[]>();

  if (error || !data) {
    return null;
  }

  return data.map(mapNotificationRow);
}

export async function getStoredNotificationsByUser(userId: string) {
  return (await getDatabaseNotifications({ userId })) ?? [];
}

export async function createDatabaseNotification(input: {
  href?: string | null;
  message: string;
  title: string;
  type: NotificationType;
  userId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      href: input.href ?? null,
      message: input.message,
      title: input.title,
      type: input.type,
      user_id: input.userId,
    })
    .select("id, user_id, type, title, message, href, read, created_at, updated_at")
    .single<NotificationRow>();

  if (error || !data) {
    return null;
  }

  return mapNotificationRow(data);
}

export async function createDatabaseNotificationsBulk(inputs: {
  href?: string | null;
  message: string;
  title: string;
  type: NotificationType;
  userId: string;
}[]) {
  if (!hasSupabaseAdminEnv() || inputs.length === 0) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert(
      inputs.map((input) => ({
        href: input.href ?? null,
        message: input.message,
        title: input.title,
        type: input.type,
        user_id: input.userId,
      }))
    )
    .select("id, user_id, type, title, message, href, read, created_at, updated_at")
    .returns<NotificationRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(mapNotificationRow);
}

/**
 * Marks a notification as read for the current authenticated user.
 * Uses server client to enforce RLS - user can only update their own notifications.
 */
export async function markDatabaseNotificationRead(userId: string, notificationId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    return null;
  }

  return (await getDatabaseNotifications({ notificationId, userId }))?.[0] ?? null;
}

/**
 * Marks all unread notifications as read for the current authenticated user.
 * Uses server client to enforce RLS - user can only update their own notifications.
 */
export async function markAllDatabaseNotificationsRead(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("read", false);

  return !error;
}

/**
 * Deletes a notification for the current authenticated user.
 * Uses server client to enforce RLS - user can only delete their own notifications.
 */
export async function deleteDatabaseNotification(userId: string, notificationId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}
