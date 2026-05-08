"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, LoaderCircle } from "lucide-react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/features/ui/components/button";
import { useNotifications } from "@/hooks/use-notifications";
import { cn, formatDate } from "@/lib";
import { ApiClient } from "@/lib/api/client";

export function NotificationDropdown({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, isError } = useNotifications(userId);

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const payload = await ApiClient.request<{
        notification: {
          id: string;
        };
      }>(`/api/notifications/${id}`, { method: "PATCH" });

      if (!payload.success) {
        throw new Error(payload.error?.message || "Bildirim okundu olarak işaretlenemedi");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: () => {
      // Revert optimistic state by re-fetching
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const payload = await ApiClient.request<{ updated: true }>("/api/notifications", {
        method: "PATCH",
      });

      if (!payload.success) {
        throw new Error(payload.error?.message || "Tüm bildirimler okundu olarak işaretlenemedi");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-all outline-none hover:bg-indigo-50/80 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:bg-indigo-900/30"
          aria-label="Bildirimler"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 w-[calc(100vw-24px)] sm:w-[380px] rounded-2xl border border-border bg-background p-1.5 shadow-sm shadow-indigo-500/10 outline-none",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
          align="end"
          sideOffset={8}
        >
          <div className="mb-1 flex items-center justify-between border-b border-border/50 px-3 py-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">Bildirimler</h3>
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} yeni bildirim` : "Yeni bildirim yok"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllReadMutation.mutate()}
                className="h-8 rounded-lg px-2.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                disabled={markAllReadMutation.isPending}
              >
                Hepsini oku
              </Button>
            )}
          </div>

          <div className="max-h-[min(70vh,400px)] overflow-y-auto overflow-x-hidden">
            {isLoading ? (
              <div
                className="flex items-center justify-center py-10"
                role="status"
                aria-label="Bildirimler yükleniyor"
              >
                <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div
                className="flex flex-col items-center justify-center px-6 py-10 text-center"
                role="alert"
              >
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-rose-50">
                  <AlertCircle className="size-6 text-rose-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Bildirimler yüklenemedi</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bir hata oluştu. Lütfen sayfayı yenile.
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center px-6 py-10 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted/30">
                  <Bell className="size-6 text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm font-medium text-foreground">Henüz bildirim yok</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  İlanların onaylandığında veya bir mesaj geldiğinde burada görünecek.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-0.5">
                {notifications.map((notification) => (
                  <DropdownMenu.Item
                    key={notification.id}
                    className={cn(
                      "group flex cursor-pointer flex-col gap-1 rounded-xl p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      notification.read
                        ? "bg-background hover:bg-muted/30"
                        : "bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20"
                    )}
                    onClick={() => {
                      if (!notification.read && notification.id) {
                        markReadMutation.mutate(notification.id);
                      }
                      if (notification.href) {
                        setIsOpen(false);
                        router.push(notification.href);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-xs font-bold leading-tight",
                            notification.read
                              ? "text-foreground/90"
                              : "text-indigo-900 dark:text-indigo-200"
                          )}
                        >
                          {notification.title}
                        </span>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      {formatDate(notification.createdAt)}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </div>
            )}
          </div>

          <div className="mt-1 border-t border-border/50 px-1 pb-1 pt-1.5">
            <Link
              href="/dashboard/notifications"
              className="flex min-h-11 w-full items-center justify-center rounded-lg py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setIsOpen(false)}
            >
              Tümünü gör
            </Link>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
