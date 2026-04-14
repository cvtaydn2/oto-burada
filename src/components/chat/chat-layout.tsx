"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import type { Chat } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";

interface ChatLayoutProps {
  initialChats: Chat[];
  currentUserId: string;
}

export function ChatLayout({ initialChats, currentUserId }: ChatLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get("chatId");
  const [showSidebar, setShowSidebar] = useState(!activeChatId);

  const activeChat = activeChatId
    ? initialChats.find(c => c.id === activeChatId)
    : initialChats[0];

  const handleChatSelect = (chat: Chat) => {
    router.push(`/dashboard/messages?chatId=${chat.id}`);
    setShowSidebar(false); // mobilde chat window'a geç
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Sidebar — mobilde toggle ile göster/gizle */}
      <div className={`
        ${showSidebar ? "flex" : "hidden"} md:flex
        w-full md:w-80 lg:w-96 shrink-0
        border-r border-slate-100 flex-col bg-slate-50/30
        absolute md:relative inset-0 z-10 md:z-auto
      `}>
        <ChatSidebar
          currentUserId={currentUserId}
          activeChatId={activeChat?.id}
          onChatSelect={handleChatSelect}
        />
      </div>

      {/* Chat Window */}
      <div className={`
        ${!showSidebar ? "flex" : "hidden"} md:flex
        flex-1 min-w-0 bg-white flex-col
      `}>
        {/* Mobil geri butonu */}
        <div className="flex items-center gap-3 border-b border-slate-100 p-3 md:hidden">
          <button
            onClick={() => setShowSidebar(true)}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-700 truncate">
            {activeChat?.listing?.title ?? "Mesajlar"}
          </span>
        </div>

        {activeChat ? (
          <ChatWindow chat={activeChat} currentUserId={currentUserId} key={activeChat.id} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="size-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
              <MessageSquare size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Sohbet Seçin</h3>
              <p className="text-xs font-medium text-slate-400 max-w-sm leading-relaxed">
                Mesajlarınızı görüntülemek için soldaki listeden bir konuşma seçin.
              </p>
            </div>
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden h-10 px-6 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all"
            >
              Konuşmaları Gör
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
