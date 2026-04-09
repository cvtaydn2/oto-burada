import { NotificationsPanel } from "@/components/shared/notifications-panel";
import { requireUser } from "@/lib/auth/session";
import { getStoredNotificationsByUser } from "@/services/notifications/notification-records";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getStoredNotificationsByUser(user.id);

  const initialNotifications = notifications.map((notification) => ({
    createdAt: notification.createdAt,
    href: notification.href,
    id: notification.id ?? "",
    message: notification.message,
    read: notification.read,
    title: notification.title,
    type: notification.type,
  }));

  return <NotificationsPanel initialNotifications={initialNotifications} />;
}
