"use server";

import {
  deleteDatabaseNotification,
  getStoredNotificationsByUser,
  markAllDatabaseNotificationsRead,
  markDatabaseNotificationRead,
} from "@/features/notifications/services/notification-records";
import type { Notification } from "@/types";

async function verifyAuth() {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Yetkilendirme başarısız.");
  }
  return user;
}

export async function getNotificationsAction(): Promise<Notification[]> {
  const user = await verifyAuth();
  return getStoredNotificationsByUser(user.id);
}

export async function markNotificationReadAction(notificationId: string): Promise<boolean> {
  const user = await verifyAuth();
  const notification = await markDatabaseNotificationRead(user.id, notificationId);
  return notification !== null;
}

export async function markAllNotificationsReadAction(): Promise<boolean> {
  const user = await verifyAuth();
  return markAllDatabaseNotificationsRead(user.id);
}

export async function deleteNotificationAction(notificationId: string): Promise<boolean> {
  const user = await verifyAuth();
  return deleteDatabaseNotification(user.id, notificationId);
}
