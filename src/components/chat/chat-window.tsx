"use client";

import { useEffect, useRef } from "react";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { sendMessage, getChatMessages, markMessagesAsRead } from "@/services/messages/chat-service";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chat } from "@/types";
import { Loader2 } from "lucide-react";

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
}

export function ChatWindow({ chat, currentUserId }: ChatWindowProps) {
  const { messages, setMessages, isTyping, isPartnerOnline, sendTypingStatus } = useChatRealtime(chat.id, currentUserId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Load & Mark Read
  useEffect(() => {
    const load = async () => {
      const history = await getChatMessages(chat.id);
      setMessages(history);
      await markMessagesAsRead(chat.id, currentUserId);
    };
    load();
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
    const newMessage = await sendMessage(chat.id, currentUserId, content);
    if (newMessage) {
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full border rounded-xl overflow-hidden bg-background shadow-2xl">
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
