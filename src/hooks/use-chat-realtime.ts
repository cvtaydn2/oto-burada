import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { queryKeys } from "@/lib/query-keys";
import { useSupabase } from "@/lib/supabase/client";
import type { Message, TypingIndicator } from "@/types/chat";

interface UseChatRealtimeOptions {
  chatId: string;
  userId: string;
  onMessage?: (message: Message) => void;
  onTypingChange?: (typing: boolean) => void;
  onPresenceUpdate?: (count: number) => void;
}

export function useChatRealtime(options: UseChatRealtimeOptions) {
  const { chatId, userId, onMessage, onTypingChange, onPresenceUpdate } = options;
  const supabaseClient = useSupabase();
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Use refs for callbacks to avoid re-subscribing when parent re-renders
  const onMessageRef = useRef(onMessage);
  const onTypingChangeRef = useRef(onTypingChange);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingChangeRef.current = onTypingChange;
    onPresenceUpdateRef.current = onPresenceUpdate;
  }, [onMessage, onTypingChange, onPresenceUpdate]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !userId) return;

      const typingData: TypingIndicator = { chatId, userId, isTyping };

      channelRef.current
        .send({ type: "broadcast", event: "typing", payload: typingData })
        .catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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

  const sendPresence = useCallback(() => {
    if (!channelRef.current || !userId) return;
    channelRef.current
      .track({ userId, chatId, onlineAt: new Date().toISOString() })
      .catch(() => {});
  }, [chatId, userId]);

  useEffect(() => {
    if (!chatId || !userId) return;

    // Only create channel if it doesn't exist or chatId changed
    const channelName = `chat:${chatId}`;
    const channel = supabaseClient.channel(channelName);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          if (!payload.new) return;

          const newMessage: Message = {
            id: payload.new.id as string,
            chatId: payload.new.chat_id as string,
            senderId: payload.new.sender_id as string,
            content: payload.new.content as string,
            messageType: (payload.new.message_type ?? "text") as "text" | "image" | "system",
            isRead: payload.new.is_read as boolean,
            createdAt: payload.new.created_at as string,
          };

          if (newMessage.senderId !== userId) {
            queryClient.setQueryData<Message[]>(queryKeys.chats.messages(chatId), (old) => [
              ...(old ?? []),
              newMessage,
            ]);
          }

          queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
          onMessageRef.current?.(newMessage);
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload: { userId: string; isTyping: boolean; chatId: string } }) => {
          if (onTypingChangeRef.current && payload.payload.userId !== userId) {
            onTypingChangeRef.current(payload.payload.isTyping);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state ?? {}).length;
        onPresenceUpdateRef.current?.(count);
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          channel.track({ userId, chatId, onlineAt: new Date().toISOString() }).catch(() => {});
        }
      });

    const connectionCheck = setInterval(() => {
      // Use type-safe check for connectionState if available in current version
      const ch = channel as unknown as { connectionState?: () => string };
      if (ch?.connectionState && ch.connectionState() === "CLOSED") {
        channel.subscribe();
      }
    }, 5000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      channel.unsubscribe();
      clearInterval(connectionCheck);
      channelRef.current = null;
    };
  }, [chatId, userId, supabaseClient, queryClient]); // Removed callbacks from deps

  return { sendTyping, sendPresence };
}
