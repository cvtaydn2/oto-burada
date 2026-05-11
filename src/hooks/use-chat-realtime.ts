"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface UseChatRealtimeOptions {
  chatId?: string;
  userId?: string;
  onMessage?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

interface TypingPayload {
  isTyping?: boolean;
  userId?: string;
}

export function useChatRealtime(options?: UseChatRealtimeOptions) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  const chatId = options?.chatId;
  const currentUserId = options?.userId;
  const onMessage = options?.onMessage;
  const onTypingChange = options?.onTypingChange;

  useEffect(() => {
    if (!chatId || !currentUserId) {
      typingChannelRef.current = null;
      return;
    }

    const messageChannel = supabase
      .channel(`chat-messages:${chatId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          onMessage?.();
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`chat-typing:${chatId}-${crypto.randomUUID()}`)
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: TypingPayload }) => {
        if (!payload?.userId || payload.userId === currentUserId) {
          return;
        }

        onTypingChange?.(Boolean(payload.isTyping));
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      typingChannelRef.current = null;
      void supabase.removeChannel(messageChannel);
      void supabase.removeChannel(typingChannel);
    };
  }, [chatId, currentUserId, onMessage, onTypingChange, supabase]);

  const sendTyping = useCallback(
    (isTyping: boolean = false) => {
      if (!chatId || !currentUserId || !typingChannelRef.current) {
        return;
      }

      void typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          chatId,
          isTyping,
          userId: currentUserId,
        },
      });
    },
    [chatId, currentUserId]
  );

  return {
    subscribe: () => undefined,
    unsubscribe: () => undefined,
    sendTyping,
  };
}
