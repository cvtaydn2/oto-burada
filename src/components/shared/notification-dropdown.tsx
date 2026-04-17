"use client";

import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Bell, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { cn, formatDate } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationDropdown({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading } = useNotifications(userId);

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50/80 transition-all dark:hover:bg-indigo-900/30 outline-none"
          title="Bildirimler"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 min-w-[320px] max-w-[380px] rounded-2xl border border-border bg-background p-1.5 shadow-2xl shadow-indigo-500/10 outline-none",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 mb-1">
            <h3 className="text-sm font-bold text-foreground">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                disabled={markAllReadMutation.isPending}
              >
                Hepsini oku
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                  <Bell className="size-6 text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm font-medium text-foreground">Henüz bildirim yok</p>
                <p className="text-xs text-muted-foreground mt-1">İlanların onaylandığında veya bir mesaj geldiğinde burada görünecek.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {notifications.map((notification) => (
                  <DropdownMenu.Item
                    key={notification.id}
                    className={cn(
                      "group flex flex-col gap-1 rounded-xl p-3 outline-none transition-colors cursor-pointer",
                      notification.read ? "bg-background hover:bg-muted/30" : "bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20"
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
                       <span className={cn(
                        "text-xs font-bold leading-tight",
                        notification.read ? "text-foreground/90" : "text-indigo-900 dark:text-indigo-200"
                      )}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <div className="size-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground/70 mt-1 uppercase tracking-wider">
                      {formatDate(notification.createdAt)}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/50 mt-1 pt-1.5 px-1 pb-1">
            <Link
              href="/dashboard/notifications"
              className="flex w-full items-center justify-center rounded-lg py-2 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
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
