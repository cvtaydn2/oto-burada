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
          <Card key={i} className="p-4">
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
      <Card className="p-6 text-center text-muted-foreground">
        Chat listesi yüklenirken bir hata oluştu.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b">
        <Button
          onClick={() => setShowArchived(false)}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            !showArchived
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Gelen Kutusu
        </Button>
        <Button
          onClick={() => setShowArchived(true)}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            showArchived
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Archive className="h-4 w-4" />
          Arşivlenmiş
        </Button>
      </div>

      {!chats || chats.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <MessageCircle className="h-12 w-12 opacity-50" />
            <p className="text-sm">
              {showArchived ? "Arşivlenmiş mesajınız yok" : "Henüz mesajınız yok"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent ${selectedChatId === chat.id ? "ring-2 ring-primary" : ""}`}
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
                      className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">
                      {chat.listingId ? "İlan Mesajı" : "Chat"}
                    </h3>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage?.content || "Chat başlatıldı"}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {chat.lastMessage &&
                      `Gönderen: ${chat.lastMessage.senderId === userId ? "Siz" : "Satıcı"}`}
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
