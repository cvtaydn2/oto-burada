import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Message } from "@/types";
import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";

interface RealtimeMessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useChatRealtime(chatId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  if (supabaseRef.current == null) {
    supabaseRef.current = createSupabaseBrowserClient();
  }

  useEffect(() => {
    if (!chatId) return;
    const supabase = supabaseRef.current;

    if (!supabase) {
      return;
    }

    // Request Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    // 1. Join Chat Channel
    const channel = supabase.channel(`chat:${chatId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    // 2. Listen for New Messages
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: RealtimePostgresInsertPayload<RealtimeMessageRow>) => {
          const raw = payload.new;
          const newMessage: Message = {
            id: raw.id,
            chatId: raw.chat_id,
            senderId: raw.sender_id,
            content: raw.content,
            isRead: raw.is_read,
            createdAt: raw.created_at
          };
          
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            
            // Notification logic
            if (
              newMessage.senderId !== currentUserId && 
              typeof window !== "undefined" && 
              document.hidden && 
              Notification.permission === "granted"
            ) {
              new Notification("Yeni Mesaj - OtoBurada", {
                body: newMessage.content,
                icon: "/favicon.ico",
              });
            }

            return [...prev, newMessage];
          });
        }
      )
      // 3. Listen for Presence (Online Status)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      // 4. Listen for Typing Indicators (Broadcast)
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: { userId: string; typing: boolean } }) => {
        if (payload.userId !== currentUserId) {
          setIsTyping(payload.typing);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  // Helper to broadcast typing state
  const sendTypingStatus = (typing: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing },
      });
    }
  };

  return {
    messages,
    setMessages,
    isTyping,
    onlineUsers,
    sendTypingStatus,
    isPartnerOnline: onlineUsers.length > 1, // Simple check if both are in channel
  };
}
