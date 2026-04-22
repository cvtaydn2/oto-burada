"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types";

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = createSupabaseBrowserClient();

  // 1. Initial fetch using TanStack Query
  const { data: notifications = [], isLoading, isError } = useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const response = await fetch("/api/notifications");
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || typeof payload !== "object") {
          throw new Error(`Notification fetch failed: ${response.status}`);
        }
        if (!payload.success) {
          throw new Error(payload.error?.message || "Bildirimler yüklenemedi");
        }
        return payload.data?.notifications ?? [];
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[NOTIFICATIONS] Failed to load notifications:", err);
        }
        throw err;
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
        } catch {
          // SSE mesajı parse edilemedi — sessizce geç, stream devam eder
        }
      };

      eventSource.onerror = () => {
        // EventSource automatically retries — only log in dev to avoid noise
        if (process.env.NODE_ENV !== "production") {
          console.warn("[SSE] Connection interrupted, retrying...");
        }
      };
    } catch {
      // SSE stream başlatılamadı — bildirimler Supabase realtime üzerinden gelmeye devam eder
      if (process.env.NODE_ENV !== "production") {
        console.warn("[SSE] Failed to initialize stream, falling back to Supabase realtime.");
      }
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
    isError,
  };
}
