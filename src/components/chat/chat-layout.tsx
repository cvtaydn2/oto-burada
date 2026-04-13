"use client";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import type { Chat } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";

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
    <div className="flex-1 flex overflow-hidden">
      <div className="w-80 lg:w-96 shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <ChatSidebar 
          currentUserId={currentUserId} 
          activeChatId={activeChat?.id}
          onChatSelect={handleChatSelect}
        />
      </div>
      
      <div className="flex-1 min-w-0 bg-white flex flex-col">
        {activeChat ? (
          <ChatWindow chat={activeChat} currentUserId={currentUserId} key={activeChat.id} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="size-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
               <MessageSquare size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Sohbet Seçin</h3>
              <p className="text-xs font-medium text-slate-400 italic max-w-sm leading-relaxed">
                Henüz bir konuşma seçmediniz. Mesajlarınızı görüntülemek için soldaki listeden bir seçim yapın.
              </p>
            </div>
            <button className="h-12 px-8 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all italic">
               YENİ MESAJ OLUŞTUR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
