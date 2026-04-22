"use client";

import { useEffect } from "react";
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
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) {
          throw new Error(`Notification fetch failed with status: ${response.status}`);
        }
        const payload = await response.json();
        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid notification payload format");
        }
        return payload.success ? payload.data?.notifications ?? [] : [];
      } catch (err) {
        // Fallback to empty list but log the issue for observability
        console.warn("[NOTIFICATIONS] Failed to load notifications:", err);
        return [];
      }
    },
    enabled: !!userId,
  });

  // 2. Realtime subscriptions (Supabase + SSE)
  useEffect(() => {
    if (!userId) return;

    // A. Supabase Postgres Realtime
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
        (payload: { new: { title: string; message: string } }) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          
          if (typeof window !== "undefined" && window.Notification?.permission === "granted") {
            new window.Notification(payload.new.title, {
              body: payload.new.message,
            });
          }
        }
      )
      .subscribe();

    // B. SSE Notification Stream (Redis-based)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/notifications/stream");
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected") return;
          
          // Invalidate to refresh the list
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });

          // Visual feedback
          if (typeof window !== "undefined" && window.Notification?.permission === "granted") {
            new window.Notification(data.title || "Yeni Bildirim", {
              body: data.message,
            });
          }
        } catch (err) {
          console.error("[SSE] Failed to parse message:", err);
        }
      };

      eventSource.onerror = () => {
        // EventSource automatically retries, but we can log for visibility
        console.warn("[SSE] Connection interrupted, retrying...");
      };
    } catch (err) {
      console.error("[SSE] Failed to initialize stream:", err);
    }

    return () => {
      void channel.unsubscribe();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userId, supabase, queryClient]);

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return {
    notifications: notificationsList,
    unreadCount,
    isLoading,
  };
}
