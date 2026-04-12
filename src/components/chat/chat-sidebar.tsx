"use client";

import { useEffect, useState } from "react";
import { getUserChats } from "@/services/messages/chat-service";
import type { Chat } from "@/types";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ChatSidebarProps {
  currentUserId: string;
  activeChatId?: string;
  onChatSelect: (chat: Chat) => void;
}

export function ChatSidebar({ currentUserId, activeChatId, onChatSelect }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getUserChats(currentUserId);
      setChats(data);
      setLoading(false);
    };
    load();
  }, [currentUserId]);

  const filteredChats = chats.filter(chat => 
    chat.listing?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-[350px] border-r flex flex-col bg-background/50 h-[600px] rounded-l-xl">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4 tracking-tight">Mesajlar</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9 bg-muted/50 border-none h-9 text-sm" 
            placeholder="Konuşma ara..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Yükleniyor...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Henüz bir konuşma yok.</div>
        ) : (
          <div className="flex flex-col">
            {filteredChats.map((chat) => {
              const partner = chat.buyerId === currentUserId ? chat.seller : chat.buyer;
              const isActive = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    "flex flex-col p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0 relative",
                    isActive && "bg-muted shadow-inner"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm truncate max-w-[180px]">
                      {partner?.fullName || "Kullanıcı"}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(chat.lastMessageAt || chat.createdAt), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-medium">
                    {chat.listing?.title}
                  </p>
                  <div className="mt-2 text-[11px] text-primary font-bold">
                    {chat.listing?.price?.toLocaleString("tr-TR")} TL
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
