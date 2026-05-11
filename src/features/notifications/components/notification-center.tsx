"use client";

import { Bell, Check, Clock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "info" | "success" | "warning";
}

interface NotificationCenterProps {
  notifications?: Notification[];
}

export function NotificationCenter({ notifications = [] }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);

  const unreadCount = localNotifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => {
    setLocalNotifications([]);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-bold text-foreground">Bildirimler</h3>
            {localNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Temizle
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">Bildirim yok</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yeni bildirimler burada görüntülenecek.
                </p>
              </div>
            ) : (
              localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-border p-4 transition-colors last:border-0 ${
                    notification.read ? "opacity-70" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground">{notification.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock size={10} />
                        {new Date(notification.timestamp).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        className="h-6 w-6"
                        aria-label="Okundu olarak işaretle"
                      >
                        <Check size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
