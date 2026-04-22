"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, safeFormatDistanceToNow } from "@/lib/utils";
import { getUserChats } from "@/services/messages/chat-service";
import type { Chat } from "@/types";

interface ChatSidebarProps {
  currentUserId: string;
  activeChatId?: string;
  onChatSelect: (chat: Chat) => void;
}

export function ChatSidebar({ currentUserId, activeChatId, onChatSelect }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getUserChats(currentUserId);
        if (!cancelled) {
          setChats(data);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const filteredChats = chats.filter((chat) =>
    chat.listing?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[min(70vh,600px)] w-full flex-col rounded-l-xl border-r bg-background/50 md:h-[min(75vh,600px)] md:w-[280px] xl:w-[320px]">
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
          <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
            Yükleniyor...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            Mesajlar yüklenemedi.
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                void getUserChats(currentUserId)
                  .then(setChats)
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
              className="block mx-auto mt-2 text-xs underline text-muted-foreground hover:text-foreground"
            >
              Tekrar dene
            </button>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Henüz bir konuşma yok.
          </div>
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
                      {safeFormatDistanceToNow(chat.lastMessageAt || chat.createdAt)}
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
