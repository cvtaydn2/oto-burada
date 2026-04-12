"use client";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import type { Chat } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";

interface ChatLayoutProps {
  initialChats: Chat[];
  currentUserId: string;
}

export function ChatLayout({ initialChats, currentUserId }: ChatLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("chatId");
  
  const activeChat = activeChatId 
    ? initialChats.find(c => c.id === activeChatId) 
    : initialChats[0];

  const handleChatSelect = (chat: Chat) => {
    router.push(`/dashboard/messages?chatId=${chat.id}`);
  };

  return (
    <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden border">
      <ChatSidebar 
        currentUserId={currentUserId} 
        activeChatId={activeChat?.id}
        onChatSelect={handleChatSelect}
      />
      
      <div className="flex-1 min-w-0">
        {activeChat ? (
          <ChatWindow chat={activeChat} currentUserId={currentUserId} key={activeChat.id} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 bg-muted/10">
            <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="size-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Sohbet Seçin</h3>
            <p className="text-sm max-w-[280px] text-center">
              Mesajlaşmaya başlamak için soldaki menüden bir konuşma seçin veya bir ilan üzerinden satıcıya ulaşın.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
