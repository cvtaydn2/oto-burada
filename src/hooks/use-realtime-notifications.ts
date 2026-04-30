import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";

import { useSupabase } from "@/lib/supabase/client";

export interface NotificationPayload {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  created_at: string;
}

interface UseRealtimeNotificationsOptions {
  userId: string;
  onNotification?: (notification: NotificationPayload) => void;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions) {
  const { userId, onNotification } = options;
  const supabaseClient = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const subscribe = useCallback(() => {
    if (!userId) return;

    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    channelRef.current = supabaseClient
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          if (onNotificationRef.current && payload.new) {
            const notification: NotificationPayload = {
              id: payload.new.id as string,
              user_id: payload.new.user_id as string,
              type: payload.new.type as string,
              title: payload.new.title as string,
              message: payload.new.message as string,
              href: payload.new.href as string | null,
              read: payload.new.read as boolean,
              created_at: payload.new.created_at as string,
            };
            onNotificationRef.current(notification);
          }
        }
      )
      .subscribe((status: string) => {
        if (status !== "SUBSCRIBED") {
          console.error("[RealtimeNotifications] Subscription failed:", status);
        }
      });

    return channelRef.current;
  }, [userId, supabaseClient]);

  useEffect(() => {
    void subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [subscribe]);

  return {
    subscribe,
  };
}
