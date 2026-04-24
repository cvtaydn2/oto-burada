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

    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

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

          // Only add to cache if message is from the other user (own messages are handled by optimistic update)
          if (newMessage.senderId !== userId) {
            queryClient.setQueryData<Message[]>(queryKeys.chats.messages(chatId), (old) => [
              ...(old ?? []),
              newMessage,
            ]);
          }

          // Always invalidate the chat list to update last message preview
          queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });

          onMessage?.(newMessage);
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
        const count = Object.keys(state ?? {}).length;
        onPresenceUpdate?.(count);
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          sendPresence();
        }
      });

    sendPresence();

    const connectionCheck = setInterval(() => {
      const ch = channelRef.current as { connectionState?: () => string };
      if (ch?.connectionState && ch.connectionState() === "CLOSED") {
        channelRef.current?.subscribe();
        sendPresence();
      }
    }, 5000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      channelRef.current?.unsubscribe();
      clearInterval(connectionCheck);
    };
  }, [chatId, userId, onMessage, onTypingChange, onPresenceUpdate, sendPresence, queryClient]);

  return { sendTyping, sendPresence };
}
