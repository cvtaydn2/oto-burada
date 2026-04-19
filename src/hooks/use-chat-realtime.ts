import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Message } from "@/types";
import type { RealtimeChannel, RealtimePostgresInsertPayload, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

interface RealtimeMessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface UseChatRealtimeResult {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isTyping: boolean;
  onlineUsers: string[];
  sendTypingStatus: (typing: boolean) => void;
  isPartnerOnline: boolean;
  /** Realtime bağlantı durumu: "connecting" | "connected" | "disconnected" */
  connectionStatus: ConnectionStatus;
}

export function useChatRealtime(chatId: string, currentUserId: string): UseChatRealtimeResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  // Tracks whether we missed messages while offline so we can re-fetch on reconnect
  const missedMessagesRef = useRef(false);

  if (supabaseRef.current == null) {
    supabaseRef.current = createSupabaseBrowserClient();
  }

  // Re-fetch message history after a reconnect to fill any gaps
  const syncMissedMessages = useCallback(
    async (onSync?: (msgs: Message[]) => void) => {
      const supabase = supabaseRef.current;
      if (!supabase || !chatId) return;

      const { data, error } = await supabase
        .from("messages")
        .select("id, chat_id, sender_id, content, is_read, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error || !data) return;

      const fetched: Message[] = (data as RealtimeMessageRow[]).map((row) => ({
        id: row.id,
        chatId: row.chat_id,
        senderId: row.sender_id,
        content: row.content,
        isRead: row.is_read,
        createdAt: row.created_at,
      }));

      setMessages(fetched);
      onSync?.(fetched);
    },
    [chatId],
  );

  useEffect(() => {
    if (!chatId) return;
    const supabase = supabaseRef.current;
    if (!supabase) return;

    // Request Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    // ── Subscribe helper (extracted so we can call it on reconnect) ──────────
    const subscribe = () => {
      // Clean up any existing channel before re-subscribing
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
      }

      setConnectionStatus("connecting");

      const channel = supabase.channel(`chat:${chatId}`, {
        config: { presence: { key: currentUserId } },
      });

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
          (payload: RealtimePostgresInsertPayload<RealtimeMessageRow>) => {
            const raw = payload.new;
            const newMessage: Message = {
              id: raw.id,
              chatId: raw.chat_id,
              senderId: raw.sender_id,
              content: raw.content,
              isRead: raw.is_read,
              createdAt: raw.created_at,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;

              // Push notification when tab is hidden
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
          },
        )
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          setOnlineUsers(Object.keys(state));
        })
        .on(
          "broadcast",
          { event: "typing" },
          ({ payload }: { payload: { userId: string; typing: boolean } }) => {
            if (payload.userId !== currentUserId) {
              setIsTyping(payload.typing);
            }
          },
        )
        .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");

            // If we went offline and came back, re-fetch to fill gaps
            if (missedMessagesRef.current) {
              missedMessagesRef.current = false;
              void syncMissedMessages();
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnectionStatus("disconnected");
            missedMessagesRef.current = true;
          }
        });
    };

    subscribe();

    // ── Network-level offline / online listeners ──────────────────────────────
    const handleOffline = () => {
      setConnectionStatus("disconnected");
      missedMessagesRef.current = true;
    };

    const handleOnline = () => {
      // Browser regained network — re-subscribe to pick up missed messages
      subscribe();
    };

    // ── Page visibility listener (Safari background tab) ─────────────────────
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && missedMessagesRef.current) {
        subscribe();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
      }
    };
  }, [chatId, currentUserId, syncMissedMessages]);

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
    isPartnerOnline: onlineUsers.length > 1,
    connectionStatus,
  };
}
