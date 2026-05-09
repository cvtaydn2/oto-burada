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
import { Button } from "@/components/ui/button";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { formatDate } from "@/lib/datetime/date-utils";
import { cn } from "@/lib/utils";

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
        setErrorMessage(payload?.error?.message ?? "Bildirimler güncellenemedi.");
        return;
      }

      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch {
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
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
        setErrorMessage(payload?.error?.message ?? "Bildirim güncellenemedi.");
        return;
      }

      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch {
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
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
      setErrorMessage("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Bildirimler</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} okunmamış bildirimin var.`
              : "Tüm bildirimlerin güncel. Yeni hareketler burada görünecek."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            onClick={() => setShowUnreadOnly((current) => !current)}
            className={cn(
              "h-10 rounded-xl px-4 text-sm font-medium transition-all",
              showUnreadOnly
                ? "bg-indigo-100 text-indigo-700"
                : "bg-muted text-muted-foreground hover:bg-slate-200"
            )}
          >
            {showUnreadOnly ? "Tüm bildirimler" : "Sadece okunmamışlar"}
          </Button>
          <Button
            onClick={() => void markAllAsRead()}
            disabled={activeAction === "mark-all" || unreadCount === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeAction === "mark-all" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Tümünü okundu yap
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        {filteredItems.length > 0 ? (
          filteredItems.map((notif, idx) => {
            const isLast = idx === filteredItems.length - 1;
            const isReading = activeAction === `read:${notif.id}`;
            const isDeleting = activeAction === `delete:${notif.id}`;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex flex-col gap-4 p-4 transition-all hover:bg-muted/30 sm:p-5 lg:flex-row lg:items-start",
                  !isLast && "border-b border-border/50",
                  !notif.read && "bg-indigo-50/50"
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4 lg:min-w-0 lg:flex-1">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl sm:size-12",
                      getIconColor(notif.type)
                    )}
                  >
                    {getIconForType(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <h4
                          className={cn(
                            "text-base leading-snug sm:pr-4",
                            !notif.read
                              ? "font-bold text-foreground"
                              : "font-semibold text-muted-foreground"
                          )}
                        >
                          {notif.title}
                        </h4>
                        <span className="mt-1 block text-xs font-medium text-muted-foreground/70">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">{notif.message}</p>

                    {notif.href ? (
                      <Link
                        href={notif.href}
                        className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                      >
                        Detayı aç
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:ml-auto lg:pt-0.5">
                  {!notif.read ? (
                    <Button
                      type="button"
                      onClick={() => void markSingleAsRead(notif.id)}
                      disabled={isReading || isDeleting}
                      className="h-10 rounded-xl px-3 text-muted-foreground/70 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Okundu olarak işaretle"
                    >
                      {isReading ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={16} />
                          <span className="ml-2 text-xs font-medium">Okundu</span>
                        </>
                      )}
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => void deleteNotification(notif.id)}
                    disabled={isReading || isDeleting}
                    className="h-10 rounded-xl px-3 text-muted-foreground/70 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Sil"
                  >
                    {isDeleting ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span className="ml-2 text-xs font-medium">Sil</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center sm:px-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell size={32} className="text-muted-foreground/70" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">Bildirim yok</h3>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
              Favori, moderasyon ve rapor akışları hazır olduğunda tüm güncellemeler burada
              görünecek.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
