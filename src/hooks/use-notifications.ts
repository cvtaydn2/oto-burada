"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types";

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseBrowserClient();

  // 1. Initial fetch using TanStack Query
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch("/api/notifications");
      const payload = await response.json();
      return payload.success ? payload.data : [];
    },
    enabled: !!userId,
  });

  // 2. Realtime subscription
  useEffect(() => {
    if (!userId) return;

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
        (payload) => {
          console.log("New notification received:", payload.new);
          // Invalidate query to refetch or manually update cache
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          
          // Show browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification(payload.new.title, {
              body: payload.new.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, queryClient]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
  };
}
