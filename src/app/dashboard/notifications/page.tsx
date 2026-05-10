import type { Metadata } from "next";

import { NotificationPreferencesPanel } from "@/components/shared/notification-preferences-panel";
import { NotificationsPanel } from "@/components/shared/notifications-panel";
import { requireUser } from "@/features/auth/lib/session";
import { getNotificationPreferences } from "@/features/notifications/services/notification-preferences";
import { getStoredNotificationsByUser } from "@/features/notifications/services/notification-records";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bildirimler | OtoBurada Dashboard",
  description: "Bildirimlerinizi ve bildirim tercihlerinizi dashboard içinden yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/notifications"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bildirimler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Son bildirimlerinizi inceleyin ve hangi bildirimleri almak istediğinizi yönetin.
        </p>
      </div>
      <NotificationsPanel initialNotifications={initialNotifications} />
      <NotificationPreferencesPanel initialPreferences={preferences} />
    </div>
  );
}
