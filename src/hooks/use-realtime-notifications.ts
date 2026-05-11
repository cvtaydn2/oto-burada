"use client";

import { useEffect, useMemo } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

interface NotificationPayload {
  created_at: string;
  href: string | null;
  id: string;
  message: string;
  read: boolean;
  title: string;
  type: Database["public"]["Enums"]["notification_type"];
  user_id: string;
}

interface UseRealtimeNotificationsOptions {
  userId: string;
  onNotification?: (notification: NotificationPayload) => void;
}

export function useRealtimeNotifications(options?: UseRealtimeNotificationsOptions) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const userId = options?.userId?.trim();

    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`notifications:${userId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as NotificationPayload | undefined;

          if (!next) {
            return;
          }

          options?.onNotification?.(next);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [options, supabase]);

  return null;
}
