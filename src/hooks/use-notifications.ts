"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useSupabase } from "@/components/providers/supabase-provider";
import { ApiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/types";

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();
  const { supabase } = useSupabase();

  // 1. Initial fetch using TanStack Query - Direct API call
  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery<Notification[]>({
    queryKey: queryKeys.notifications.byUser(userId!),
    queryFn: async () => {
      if (!userId) return [];
      // Direct API call to /api/notifications
      const response = await ApiClient.request<{ notifications: Notification[] }>(
        "/api/notifications"
      );
      if (!response.success) {
        throw new Error(response.error?.message || "Bildirimler yüklenemedi");
      }
      return response.data?.notifications ?? [];
    },
    enabled: !!userId,
  });

  // 2. Realtime subscriptions (Supabase)
  useEffect(() => {
    if (!userId) return;

    // Tracker for processed notification IDs to prevent duplicate toasts
    const processedIds = new Set<string>();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          const notificationId = payload.new.id || crypto.randomUUID();

          // Prevent duplicate processing
          if (processedIds.has(notificationId)) return;
          processedIds.add(notificationId);

          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.byUser(userId) });

          if (typeof window !== "undefined" && window.Notification?.permission === "granted") {
            const title = payload.new.title || "Bildirim";
            const message = payload.new.message || "";
            new window.Notification(title, {
              body: message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [userId, supabase, queryClient]);

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return {
    notifications: notificationsList,
    unreadCount,
    isLoading,
    isError,
  };
}
