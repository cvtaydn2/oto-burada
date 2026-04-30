"use client";

import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Heart,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { cn, formatDate } from "@/lib/utils";

interface NotificationItem {
  createdAt: string;
  href?: string | null;
  id: string;
  message: string;
  read: boolean;
  title: string;
  type: "favorite" | "moderation" | "report" | "system" | "question";
}

interface NotificationsPanelProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsPanel({ initialNotifications }: NotificationsPanelProps) {
  const { userId } = useAuthUser();
  const [items, setItems] = useState(initialNotifications);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // F03: Real-time notifications subscription
  useRealtimeNotifications({
    userId: userId || "",
    onNotification: (notification) => {
      setItems((prev) => [
        {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          read: false,
          createdAt: notification.created_at,
          type: notification.type as NotificationItem["type"],
        },
        ...prev,
      ]);
    },
  });

  const filteredItems = useMemo(
    () => (showUnreadOnly ? items.filter((item) => !item.read) : items),
    [items, showUnreadOnly]
  );
  const unreadCount = items.filter((item) => !item.read).length;

  const getIconForType = (type: NotificationItem["type"]) => {
    switch (type) {
      case "favorite":
        return <Heart className="size-5" />;
      case "moderation":
        return <ShieldCheck className="size-5" />;
      case "report":
        return <AlertCircle className="size-5" />;
      case "question":
        return <MessageCircle className="size-5" />;
      case "system":
      default:
        return <CheckCircle2 className="size-5" />;
    }
  };

  const getIconColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "favorite":
        return "bg-rose-100 text-rose-600";
      case "moderation":
        return "bg-emerald-100 text-emerald-600";
      case "report":
        return "bg-amber-100 text-amber-600";
      case "question":
        return "bg-blue-100 text-blue-600";
      case "system":
      default:
        return "bg-indigo-100 text-indigo-600";
    }
  };

  const markAllAsRead = async () => {
    setActiveAction("mark-all");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error?.message ?? "Bildirimler guncellenemedi.");
        return;
      }

      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch {
      setErrorMessage("Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  const markSingleAsRead = async (id: string) => {
    setActiveAction(`read:${id}`);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error?.message ?? "Bildirim guncellenemedi.");
        return;
      }

      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch {
      setErrorMessage("Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  const deleteNotification = async (id: string) => {
    setActiveAction(`delete:${id}`);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload?.success) {
        setErrorMessage(payload?.error?.message ?? "Bildirim silinemedi.");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setErrorMessage("Baglanti sirasinda bir hata olustu. Lutfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-card border border-border/60 p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bildirimler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount} okunmamis bildirimin var
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUnreadOnly((current) => !current)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              showUnreadOnly
                ? "bg-indigo-100 text-indigo-700"
                : "bg-muted text-muted-foreground hover:bg-slate-200"
            )}
          >
            {showUnreadOnly ? "Tumu" : "Okunmamis"}
          </button>
          <button
            onClick={() => void markAllAsRead()}
            disabled={activeAction === "mark-all" || unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeAction === "mark-all" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Tumunu Oku
          </button>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
        {filteredItems.length > 0 ? (
          filteredItems.map((notif, idx) => {
            const isLast = idx === filteredItems.length - 1;
            const isReading = activeAction === `read:${notif.id}`;
            const isDeleting = activeAction === `delete:${notif.id}`;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex gap-4 p-5 transition-all hover:bg-muted/30 sm:p-6",
                  !isLast && "border-b border-border/50",
                  !notif.read && "bg-indigo-50/50"
                )}
              >
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                    getIconColor(notif.type)
                  )}
                >
                  {getIconForType(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4
                        className={cn(
                          "truncate pr-4 text-base",
                          !notif.read
                            ? "font-bold text-foreground"
                            : "font-semibold text-muted-foreground"
                        )}
                      >
                        {notif.title}
                      </h4>
                      <span className="mt-1 block shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground/70">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>

                  {notif.href ? (
                    <Link
                      href={notif.href}
                      className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                      Detayi ac
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-start gap-2">
                  {!notif.read ? (
                    <button
                      type="button"
                      onClick={() => void markSingleAsRead(notif.id)}
                      disabled={isReading || isDeleting}
                      className="mt-1 p-2 rounded-xl text-muted-foreground/70 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      title="Okundu olarak işaretle"
                    >
                      {isReading ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </button>
                  ) : null}
                  <button
                    onClick={() => void deleteNotification(notif.id)}
                    disabled={isReading || isDeleting}
                    className="mt-1 p-2 rounded-xl text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    title="Sil"
                  >
                    {isDeleting ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell size={32} className="text-muted-foreground/70" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Bildirim yok</h3>
            <p className="text-muted-foreground">
              Favori, moderasyon ve rapor olaylari burada gorunecek.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
