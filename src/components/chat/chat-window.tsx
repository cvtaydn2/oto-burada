"use client";

import { useEffect, useRef, useState } from "react";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { sendMessage, getChatMessages, markMessagesAsRead } from "@/services/messages/chat-service";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chat } from "@/types";
import { Loader2, WifiOff } from "lucide-react";

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
}

export function ChatWindow({ chat, currentUserId }: ChatWindowProps) {
  const { messages, setMessages, isTyping, isPartnerOnline, sendTypingStatus, connectionStatus, broadcastMessage } = useChatRealtime(chat.id, currentUserId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Initial Load & Mark Read
  useEffect(() => {
    const load = async () => {
      setIsLoadingHistory(true);
      setErrorMessage(null);

      try {
        const history = await getChatMessages(chat.id);
        setMessages(history);
        await markMessagesAsRead(chat.id, currentUserId);
      } catch {
        setErrorMessage("Mesajlar yüklenemedi. Lütfen tekrar deneyin.");
      } finally {
        setIsLoadingHistory(false);
      }
    };
    void load();
  }, [chat.id, currentUserId, setMessages]);

  // Mark new messages as read when they arrive if window is focused
  useEffect(() => {
     if (messages.length > 0 && typeof document !== "undefined" && !document.hidden) {
        markMessagesAsRead(chat.id, currentUserId);
     }
  }, [messages, chat.id, currentUserId]);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    setErrorMessage(null);

    try {
      const newMessage = await sendMessage(chat.id, currentUserId, content);
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
        broadcastMessage(newMessage);
        return;
      }

      setErrorMessage("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } catch {
      setErrorMessage("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="flex min-h-[420px] w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm h-[min(70vh,600px)] md:h-[min(75vh,600px)]">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30 backdrop-blur-md">
        <div>
          <h3 className="font-semibold text-sm">{chat.listing?.title || "İlan Mesajlaşma"}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isPartnerOnline ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {isPartnerOnline ? "Çevrimiçi" : "Çevrimdışı"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-primary">
            {chat.listing?.price?.toLocaleString("tr-TR")} TL
          </p>
        </div>
      </div>

      {/* Connection status banner */}
      {connectionStatus !== "connected" && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
            connectionStatus === "disconnected"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {connectionStatus === "disconnected" ? (
            <>
              <WifiOff className="w-3 h-3 shrink-0" />
              <span>Bağlantı kesildi — yeniden bağlanılıyor...</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              <span>Bağlanılıyor...</span>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-xs font-medium text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-dot-pattern">
        <div 
          className="flex flex-col gap-1 min-h-full justify-end" 
          role="log" 
          aria-live="polite" 
          aria-relevant="additions"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isMe={msg.senderId === currentUserId} />
          ))}

          {isLoadingHistory && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 ml-4">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Mesajlar yükleniyor...</span>
            </div>
          )}
          
          {isTyping && (
            <div 
              className="flex gap-2 items-center text-muted-foreground text-xs animate-pulse mb-4 ml-4"
              aria-live="assertive"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Karşı taraf yazıyor...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <ChatInput onSendMessage={handleSend} onTyping={sendTypingStatus} />
    </div>
  );
}
