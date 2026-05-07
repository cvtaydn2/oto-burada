"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatList } from "@/features/chat/components/chat-list";
import { ChatWindow } from "@/features/chat/components/chat-window";
import { useAuthUser } from "@/features/shared/components/auth-provider";
import { API_ROUTES } from "@/features/shared/lib/api-routes";
import { ApiClient } from "@/features/shared/lib/client";
import { Button } from "@/features/ui/components/button";
import { Card } from "@/features/ui/components/card";
import { useCreateChat } from "@/hooks/use-chat-queries";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ChatWithLastMessage } from "@/types/chat";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { userId, isReady: isAuthResolved, isAuthenticated } = useAuthUser();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const createChatMutation = useCreateChat();
  const hasHandledPrefillRef = useRef(false);

  // Stable callback for chat selection - prevents unnecessary re-renders of ChatList
  const handleChatSelect = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  // Stable callback for back navigation
  const handleBack = useCallback(() => {
    setSelectedChatId(null);
  }, []);

  useEffect(() => {
    if (!isAuthResolved || !userId || hasHandledPrefillRef.current) {
      return;
    }

    const listingId = searchParams.get("new");
    const sellerId = searchParams.get("seller");

    if (!listingId || !sellerId) {
      hasHandledPrefillRef.current = true;
      return;
    }

    hasHandledPrefillRef.current = true;

    void createChatMutation
      .mutateAsync({
        listingId,
        sellerId,
        buyerId: userId,
      })
      .then((chat) => {
        if (chat?.id) {
          setSelectedChatId(chat.id);
        }
      })
      .catch(async () => {
        // Eğer chat zaten varsa create hatası alabiliriz.
        // Bu durumda mevcut chat'i bulup paneli aç.
        const existingChatResponse = await ApiClient.request<ChatWithLastMessage[]>(
          API_ROUTES.CHATS.BASE
        );

        if (!existingChatResponse.success || !Array.isArray(existingChatResponse.data)) {
          return;
        }

        const existingChat = existingChatResponse.data.find(
          (chat) => chat.listingId === listingId && chat.sellerId === sellerId
        );

        if (existingChat?.id) {
          setSelectedChatId(existingChat.id);
        }
      });
  }, [isAuthResolved, userId, searchParams, createChatMutation]);

  // Show chat list on desktop, or when no chat selected on mobile
  const showChatList = !isMobile || !selectedChatId;
  const showChatWindow = !isMobile || selectedChatId;

  if (!isAuthResolved) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="p-8 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Mesajlar yükleniyor...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="p-8 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Oturum bulunamadı. Lütfen yeniden giriş yapın.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {showChatList && (
        <Card
          className={`${isMobile && selectedChatId ? "hidden" : ""} flex-1 p-4 md:p-6 overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Mesajlarım</h2>
          </div>
          <div className="h-[calc(100vh-14rem)] overflow-hidden">
            <ChatList
              userId={userId}
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChatId || undefined}
            />
          </div>
        </Card>
      )}

      {showChatWindow && (
        <Card
          className={`${!isMobile && !selectedChatId ? "hidden md:flex" : ""} flex-1 flex flex-col`}
        >
          {isMobile && selectedChatId && (
            <div className="p-4 border-b">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} userId={userId} onBack={handleBack} />
          ) : (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div className="max-w-md">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Mesajınızı seçin</h3>
                <p className="text-muted-foreground">
                  Sol taraftan bir sohbet seçerek mesajlaşmaya başlayabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
