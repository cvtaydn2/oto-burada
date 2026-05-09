"use client";

import { ArrowLeft, Car } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArchiveChat,
  useChatMessages,
  useDeleteMessage,
  useMarkAsRead,
  useSendMessage,
} from "@/hooks/use-chat-queries";
import { useChatRealtime } from "@/hooks/use-chat-realtime";

import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface ChatWindowProps {
  chatId: string;
  userId: string;
  recipientName?: string;
  onBack?: () => void;
}

export function ChatWindow({ chatId, userId, recipientName, onBack }: ChatWindowProps) {
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, error, refetch } = useChatMessages(chatId, userId);

  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead(chatId);
  const archiveMutation = useArchiveChat();
  const deleteMessageMutation = useDeleteMessage();

  // Memoize callbacks for realtime to prevent re-subscription loops
  const handleMessage = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Realtime updates
  const { sendTyping } = useChatRealtime({
    chatId,
    userId,
    onMessage: handleMessage,
    onTypingChange: setIsTyping,
  });

  // Mark as read when chatId changes OR when new unread messages arrive from other user
  useEffect(() => {
    const hasUnread = messages?.some((m) => !m.isRead && m.senderId !== userId);
    if (chatId && userId && hasUnread && !markAsReadMutation.isPending) {
      markAsReadMutation.mutate();
    }
  }, [chatId, userId, messages, markAsReadMutation]);

  const handleArchive = async () => {
    if (!window.confirm("Bu sohbeti arşivlemek istediğinize emin misiniz?")) return;

    try {
      await archiveMutation.mutateAsync({ chatId, archive: true });
      if (onBack) onBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sohbet arşivlenemedi.";
      toast.error(message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;

    try {
      await deleteMessageMutation.mutateAsync({ chatId, messageId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mesaj silinemedi.";
      toast.error(message);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isLoading && messages && messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isLoading, messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        chatId,
        senderId: userId,
        content: content.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mesaj gönderilemedi.";
      toast.error(message);
    }
  };

  const handleTyping = (typing: boolean) => {
    sendTyping(typing);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b bg-background/95 p-4">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex-1 space-y-4 p-4 sm:p-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-5 text-center">
        <Car className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">Mesajlar yüklenemedi</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Konuşma geçmişine şu anda ulaşılamıyor. Bağlantıyı yenileyip tekrar deneyin.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
          Yeniden dene
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b bg-background/95 p-4 backdrop-blur sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <Car className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-medium text-foreground">{recipientName || "Satıcı"}</h3>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "Yazıyor..." : "Mesajlaşma aktif"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleArchive}
          disabled={archiveMutation.isPending}
          className="shrink-0"
        >
          Arşivle
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4 sm:px-5" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === userId}
                onDelete={handleDeleteMessage}
              />
            ))
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
              <div className="max-w-sm space-y-2">
                <p className="text-sm font-semibold text-foreground">Henüz mesaj yok</p>
                <p className="text-sm text-muted-foreground">
                  İlk mesajı göndererek araçla ilgili detayları netleştirebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4 sm:p-5">
        <ChatInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}
