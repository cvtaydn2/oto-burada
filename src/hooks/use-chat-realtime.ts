import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";

import { useSupabase } from "@/lib/supabase/client";
import type { Message, TypingIndicator } from "@/types/chat";

interface UseChatRealtimeOptions {
  chatId: string;
  userId: string;
  onMessage?: (message: Message) => void;
  onTypingChange?: (typing: boolean) => void;
  onPresenceUpdate?: (count: number) => void;
}

/**
 * Real-time chat hook using Supabase Realtime
 * Features:
 * - Real-time message subscription
 * - Typing indicators
 * - Presence tracking (online users in chat)
 * - Automatic reconnection
 */
export function useChatRealtime(options: UseChatRealtimeOptions) {
  const { chatId, userId, onMessage, onTypingChange, onPresenceUpdate } = options;
  const supabaseClient = useSupabase();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !userId) return;

      const typingData: TypingIndicator = {
        chatId,
        userId,
        isTyping,
      };

      channelRef.current
        .send({
          type: "broadcast",
          event: "typing",
          payload: typingData,
        })
        .catch(() => {
          // Ignore broadcast errors in realtime
        });

      // Auto-disable typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (channelRef.current && userId) {
            channelRef.current
              .send({
                type: "broadcast",
                event: "typing",
                payload: { chatId, userId, isTyping: false } as TypingIndicator,
              })
              .catch(() => {});
          }
        }, 3000);
      }
    },
    [chatId, userId]
  );

  /**
   * Send presence state
   */
  const sendPresence = useCallback(() => {
    if (!channelRef.current || !userId) return;

    channelRef.current
      .track({
        userId,
        chatId,
        onlineAt: new Date().toISOString(),
      })
      .catch(() => {
        // Ignore presence tracking errors
      });
  }, [chatId, userId]);

  /**
   * Initialize realtime channel
   */
  useEffect(() => {
    if (!chatId || !userId) return;

    // Cleanup previous channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Subscribe to chat messages
    channelRef.current = supabaseClient
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          if (onMessage && payload.new) {
            const newMessage: Message = {
              id: payload.new.id as string,
              chatId: payload.new.chat_id as string,
              senderId: payload.new.sender_id as string,
              content: payload.new.content as string,
              messageType: (payload.new.message_type ?? "text") as "text" | "image" | "system",
              isRead: payload.new.is_read as boolean,
              createdAt: payload.new.created_at as string,
            };
            onMessage(newMessage);
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload: { userId: string; isTyping: boolean; chatId: string } }) => {
          if (onTypingChange && payload.payload.userId !== userId) {
            onTypingChange(payload.payload.isTyping);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channelRef.current?.presenceState();
        const count = Object.keys(state || {}).length;
        if (onPresenceUpdate) {
          onPresenceUpdate(count);
        }
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          sendPresence();
        }
      });

    // Send initial presence
    sendPresence();

    // Reconnect logic: track connection state
    const connectionCheck = setInterval(() => {
      const ch = channelRef.current as { connectionState?: () => string };
      if (ch && ch.connectionState && ch.connectionState() === "CLOSED") {
        // Try to resubscribe
        channelRef.current?.subscribe();
        sendPresence();
      }
    }, 5000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      clearInterval(connectionCheck);
    };
  }, [chatId, userId, onMessage, onTypingChange, onPresenceUpdate, sendPresence]);

  return {
    sendTyping,
    sendPresence,
  };
}
