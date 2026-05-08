"use client";

import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Archive, Car, Inbox, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/features/ui/components/avatar";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import { Card } from "@/features/ui/components/card";
import { Skeleton } from "@/features/ui/components/skeleton";
import { useChats } from "@/hooks/use-chat-queries";
import { ChatWithLastMessage } from "@/types/chat";

interface ChatListProps {
  userId: string;
  onChatSelect?: (chatId: string) => void;
  selectedChatId?: string;
}

export function ChatList({ userId, onChatSelect, selectedChatId }: ChatListProps) {
  const [showArchived, setShowArchived] = useState(false);
  const { data: chats, isLoading, error } = useChats(userId, showArchived);
  const router = useRouter();

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
  };

  const handleChatClick = (chat: ChatWithLastMessage) => {
    if (onChatSelect) {
      onChatSelect(chat.id);
    } else {
      router.push(`/dashboard/messages/${chat.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="rounded-2xl border-border/60 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-border/60 p-6 text-center text-muted-foreground shadow-sm">
        Chat listesi yüklenirken bir hata oluştu.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-muted/30 p-1">
        <Button
          onClick={() => setShowArchived(false)}
          className={`h-10 rounded-xl text-sm font-medium transition-colors ${
            !showArchived
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox className="mr-2 h-4 w-4" />
          Gelen Kutusu
        </Button>
        <Button
          onClick={() => setShowArchived(true)}
          className={`h-10 rounded-xl text-sm font-medium transition-colors ${
            showArchived
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Archive className="mr-2 h-4 w-4" />
          Arşiv
        </Button>
      </div>

      {!chats || chats.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/70 p-8 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <MessageCircle className="h-12 w-12 opacity-50" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {showArchived ? "Arşivlenmiş mesajınız yok" : "Henüz mesajınız yok"}
              </p>
              <p className="text-xs text-muted-foreground">
                {showArchived
                  ? "Arşive taşıdığınız konuşmalar burada listelenecek."
                  : "Yeni WhatsApp ve ilan görüşmeleri burada birikir."}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className={`cursor-pointer rounded-2xl border-border/60 p-4 transition-all hover:border-primary/20 hover:bg-accent/40 ${selectedChatId === chat.id ? "ring-2 ring-primary/20 border-primary/30 bg-primary/5" : "shadow-sm"}`}
              onClick={() => handleChatClick(chat)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt="User avatar" />
                    <AvatarFallback>
                      <Car className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
                    >
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {chat.listingId ? "İlan mesajı" : "Sohbet"}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {chat.lastMessage?.content || "Konuşma başlatıldı"}
                      </p>
                    </div>
                    {chat.lastMessageAt && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground/70">
                    {chat.lastMessage &&
                      `Son gönderen: ${chat.lastMessage.senderId === userId ? "Siz" : "Satıcı"}`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
