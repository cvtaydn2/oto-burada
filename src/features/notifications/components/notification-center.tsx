"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { formatDate } from "@/lib/datetime/date-utils";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

export function NotificationCenter() {
  const { userId, isAuthenticated } = useAuthUser();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Only fetch if authenticated
  const { notifications, unreadCount, isLoading, refetch } = useNotifications(userId || undefined);

  // Setup realtime listeners
  useRealtimeNotifications({
    userId: userId || "",
    onNotification: () => {
      // Trigger immediate refetch on new notification
      void refetch();
    },
  });

  // Setup click-outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = () => setIsOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const response = await ApiClient.request<{ notification: Notification }>(
        `${API_ROUTES.NOTIFICATIONS.BASE}/${id}`,
        { method: "PATCH" }
      );
      if (response.success) {
        // Invalidate notifications queries to refresh state across views
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "favorite":
        return <Heart className="size-4 text-rose-500" />;
      case "moderation":
        return <ShieldCheck className="size-4 text-emerald-500" />;
      case "report":
        return <AlertCircle className="size-4 text-amber-500" />;
      case "question":
        return <MessageCircle className="size-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="size-4 text-indigo-500" />;
    }
  };

  // Limit to latest 5 for dropdown
  const latestNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-10 w-10 rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-primary lg:h-11 lg:w-11",
          isOpen && "bg-muted text-primary"
        )}
        aria-label="Bildirimler"
      >
        <Bell size={20} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-80 rounded-2xl border border-border/80 bg-card shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/50 p-4 pb-3">
            <h3 className="font-bold text-foreground tracking-tight flex items-center gap-2">
              Bildirimler
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Tümünü Gör
            </Link>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                <span className="text-xs text-muted-foreground">Yükleniyor...</span>
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell size={20} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">Bildirim yok</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Henüz yeni bir bildirim almadınız.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/40">
                {latestNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3.5 transition-colors hover:bg-muted/50 relative group flex gap-3",
                      !notification.read && "bg-primary/[0.02]"
                    )}
                  >
                    <div className="mt-0.5 size-8 shrink-0 rounded-full bg-muted/60 flex items-center justify-center">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          className={cn(
                            "text-sm leading-tight line-clamp-2",
                            !notification.read
                              ? "font-bold text-foreground"
                              : "font-medium text-muted-foreground"
                          )}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="shrink-0 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                            title="Okundu"
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        <Clock size={10} />
                        {formatDate(notification.createdAt)}
                      </div>

                      {notification.href && (
                        <Link
                          href={notification.href}
                          onClick={() => setIsOpen(false)}
                          className="absolute inset-0 z-0"
                          aria-label="Bildirim detayına git"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {latestNotifications.length > 0 && (
            <div className="p-2 border-t border-border/50 bg-muted/20 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Hepsini Yönet
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
