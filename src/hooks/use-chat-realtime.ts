import type { REALTIME_SUBSCRIBE_STATES, RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSupabase } from "@/components/providers/supabase-provider";
import type { Message } from "@/types";

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
  /** Mesajı diğer katılımcıya broadcast eder */
  broadcastMessage: (message: Message) => void;
}

export function useChatRealtime(chatId: string, currentUserId: string): UseChatRealtimeResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { supabase } = useSupabase();
  // Tracks whether we missed messages while offline so we can re-fetch on reconnect
  const missedMessagesRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Re-fetch message history after a reconnect to fill any gaps
  const syncMissedMessages = useCallback(
    async (onSync?: (msgs: Message[]) => void) => {
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
    [chatId, supabase]
  );

  // ── Subscribe helper (extracted so we can call it on reconnect) ──────────
  const subscribeRef = useRef<(() => void) | undefined>(undefined);

  const subscribe = useCallback(() => {
    if (!supabase || !chatId) return;

    // Clean up any existing channel before re-subscribing
    if (channelRef.current) {
      void channelRef.current.unsubscribe();
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setConnectionStatus("connecting");

    const channel = supabase.channel(`chat:${chatId}`, {
      config: { presence: { key: currentUserId } },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "message" }, ({ payload }: { payload: Message }) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;

          // Push notification when tab is hidden
          if (
            payload.senderId !== currentUserId &&
            typeof window !== "undefined" &&
            document.hidden &&
            Notification.permission === "granted"
          ) {
            new Notification("Yeni Mesaj - OtoBurada", {
              body: payload.content,
              icon: "/favicon.ico",
            });
          }

          return [...prev, payload];
        });
      })
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
        }
      )
      .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          retryCountRef.current = 0; // Reset on success

          // If we went offline and came back, re-fetch to fill gaps
          if (missedMessagesRef.current) {
            missedMessagesRef.current = false;
            void syncMissedMessages();
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnectionStatus("disconnected");
          missedMessagesRef.current = true;

          // Exponential backoff retry
          if (status !== "CLOSED") {
            const backoff = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current++;
            retryTimeoutRef.current = setTimeout(() => {
              subscribeRef.current?.();
            }, backoff);
          }
        }
      });
  }, [chatId, currentUserId, syncMissedMessages, setMessages, supabase]);

  // Keep the ref updated so the timeout can call the latest version
  useEffect(() => {
    subscribeRef.current = subscribe;
  }, [subscribe]);

  const statusRef = useRef<ConnectionStatus>(connectionStatus);
  useEffect(() => {
    statusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    if (!chatId) return;

    // Request Notification Permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    subscribe();

    // ── Network-level offline / online listeners ──────────────────────────────
    const handleOffline = () => {
      setConnectionStatus("disconnected");
      missedMessagesRef.current = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };

    const handleOnline = () => {
      retryCountRef.current = 0;
      subscribe();
    };

    // ── Page visibility listener (Safari background tab) ─────────────────────
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        (missedMessagesRef.current || statusRef.current === "disconnected")
      ) {
        retryCountRef.current = 0;
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
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
      }
    };
  }, [chatId, subscribe]);

  const sendTypingStatus = (typing: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing },
      });
    }
  };

  const broadcastMessage = (message: Message) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: message,
      });
    }
  };

  return {
    messages,
    setMessages,
    isTyping,
    onlineUsers,
    sendTypingStatus,
    broadcastMessage,
    isPartnerOnline: onlineUsers.length > 1,
    connectionStatus,
  };
}
