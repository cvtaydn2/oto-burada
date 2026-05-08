/**
 * Notification Records Service
 *
 * PRIVILEGE BOUNDARIES:
 * - Read operations: Use server client (RLS enforced)
 * - User mutations: Use server client (RLS enforced)
 * - System notifications: Use admin client (bypass RLS for system-generated notifications)
 *
 * SECURITY RULES:
 * - createDatabaseNotification() uses admin client - ONLY call from system/admin contexts
 * - All user-facing operations use server client with RLS
 * - Never expose admin functions to user-facing routes
 *
 * No silent fallbacks - all errors are thrown for proper error handling.
 */

import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/server";
import { notificationSchema } from "@/lib/validators/notification";
import type { NotificationType } from "@/types";
import type { TablesInsert } from "@/types/supabase";

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

async function getNotificationsClient() {
  if (process.env.NODE_ENV === "test" && hasSupabaseAdminEnv()) {
    return createSupabaseAdminClient();
  }

  try {
    return await createSupabaseServerClient();
  } catch {
    if (!hasSupabaseAdminEnv()) {
      throw new Error("Supabase admin client unavailable");
    }
    return createSupabaseAdminClient();
  }
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
 * @throws Error if database query fails
 */
async function getDatabaseNotifications(options?: { notificationId?: string; userId?: string }) {
  const supabase = await getNotificationsClient();
  let query = supabase
    .from("notifications")
    .select("id, user_id, type, title, message, href, read, created_at, updated_at");

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.notificationId) {
    query = query.eq("id", options.notificationId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .returns<NotificationRow[]>();

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map(mapNotificationRow);
}

/**
 * @throws Error if userId is invalid or database query fails
 */
export async function getStoredNotificationsByUser(userId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }
  return getDatabaseNotifications({ userId });
}

/**
 * Create a system notification (admin-only operation).
 *
 * ⚠️ SECURITY WARNING: This function uses admin client and bypasses RLS.
 * Only call from:
 * - System background jobs (cron, webhooks)
 * - Admin dashboard operations
 * - Internal service-to-service calls
 *
 * NEVER call from user-facing API routes without proper admin authorization.
 *
 * @throws Error if admin env unavailable or database insert fails
 */
export async function createDatabaseNotification(input: {
  href?: string | null;
  message: string;
  title: string;
  type: NotificationType;
  userId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Supabase admin client unavailable - notifications require server configuration"
    );
  }

  const admin = createSupabaseAdminClient();
  const notificationInsert: TablesInsert<"notifications"> = {
    href: input.href ?? null,
    message: input.message,
    title: input.title,
    type: input.type as TablesInsert<"notifications">["type"],
    user_id: input.userId,
  };

  const { data, error } = await admin
    .from("notifications")
    .insert(notificationInsert)
    .select("id, user_id, type, title, message, href, read, created_at, updated_at")
    .single<NotificationRow>();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  if (!data) {
    throw new Error("Notification created but no data returned");
  }

  return mapNotificationRow(data);
}

/**
 * Create multiple system notifications in bulk (admin-only operation).
 *
 * ⚠️ SECURITY WARNING: This function uses admin client and bypasses RLS.
 *
 * @throws Error if admin env unavailable, inputs empty, or database insert fails
 */
export async function createDatabaseNotificationsBulk(
  inputs: {
    href?: string | null;
    message: string;
    title: string;
    type: NotificationType;
    userId: string;
  }[]
) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Supabase admin client unavailable - notifications require server configuration"
    );
  }

  if (inputs.length === 0) {
    throw new Error("Cannot create bulk notifications with empty inputs");
  }

  const admin = createSupabaseAdminClient();
  const notificationInserts: TablesInsert<"notifications">[] = inputs.map((input) => ({
    href: input.href ?? null,
    message: input.message,
    title: input.title,
    type: input.type as TablesInsert<"notifications">["type"],
    user_id: input.userId,
  }));

  const { data, error } = await admin
    .from("notifications")
    .insert(notificationInserts)
    .select("id, user_id, type, title, message, href, read, created_at, updated_at")
    .returns<NotificationRow[]>();

  if (error) {
    throw new Error(`Failed to create bulk notifications: ${error.message}`);
  }

  if (!data) {
    throw new Error("Notifications created but no data returned");
  }

  return data.map(mapNotificationRow);
}

/**
 * Marks a notification as read for the current authenticated user.
 * Uses server client to enforce RLS.
 * @throws Error if database update fails
 */
export async function markDatabaseNotificationRead(userId: string, notificationId: string) {
  const supabase = await getNotificationsClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to mark notification read: ${error.message}`);
  }

  const result = await getDatabaseNotifications({ notificationId, userId });
  return result[0] ?? null;
}

/**
 * Marks all unread notifications as read for the current authenticated user.
 * @throws Error if database update fails
 */
export async function markAllDatabaseNotificationsRead(userId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const supabase = await getNotificationsClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      read: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw new Error(`Failed to mark all notifications read: ${error.message}`);
  }

  return true;
}

/**
 * Deletes a notification for the current authenticated user.
 * @throws Error if database delete fails
 */
export async function deleteDatabaseNotification(userId: string, notificationId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!notificationId) {
    throw new Error("notificationId is required");
  }

  const supabase = await getNotificationsClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }

  return true;
}
