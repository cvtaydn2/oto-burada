import { NotificationPreferencesPanel } from "@/components/shared/notification-preferences-panel";
import { NotificationsPanel } from "@/components/shared/notifications-panel";
import { requireUser } from "@/features/auth/lib/session";
import { getNotificationPreferences } from "@/features/notifications/services/notification-preferences";
import { getStoredNotificationsByUser } from "@/features/notifications/services/notification-records";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [notifications, preferences] = await Promise.all([
    getStoredNotificationsByUser(user.id),
    getNotificationPreferences(user.id),
  ]);

  const initialNotifications = notifications.map((notification) => ({
    createdAt: notification.createdAt,
    href: notification.href,
    id: notification.id ?? "",
    message: notification.message,
    read: notification.read,
    title: notification.title,
    type: notification.type,
  }));

  return (
    <div className="space-y-8">
      <NotificationsPanel initialNotifications={initialNotifications} />
      <NotificationPreferencesPanel initialPreferences={preferences} />
    </div>
  );
}
