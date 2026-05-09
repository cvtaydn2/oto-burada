"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatList } from "@/features/chat/components/chat-list";
import { ChatWindow } from "@/features/chat/components/chat-window";
import { useCreateChat } from "@/hooks/use-chat-queries";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import type { ChatWithLastMessage } from "@/types/chat";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { userId, isReady: isAuthResolved, isAuthenticated } = useAuthUser();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const createChatMutation = useCreateChat();
  const hasHandledPrefillRef = useRef(false);
  const [showSessionNotFound, setShowSessionNotFound] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthResolved && !isAuthenticated) {
      timer = setTimeout(() => {
        setShowSessionNotFound(true);
      }, 1000);
    } else {
      timer = setTimeout(() => {
        setShowSessionNotFound(false);
      }, 0);
    }
    return () => clearTimeout(timer);
  }, [isAuthResolved, isAuthenticated]);

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

  if (!isAuthResolved || (!isAuthenticated && !showSessionNotFound)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-3xl border-border/60 p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Mesajlar yükleniyor...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-3xl border-border/60 p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Oturum bulunamadı. Lütfen yeniden giriş yapın.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-3 sm:p-4 lg:flex-row">
      {showChatList && (
        <Card
          className={`${isMobile && selectedChatId ? "hidden" : ""} flex min-h-[calc(100vh-14rem)] flex-1 flex-col overflow-hidden rounded-3xl border-border/60 p-4 shadow-sm md:p-5 lg:max-w-[380px]`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground md:text-xl">Mesajlarım</h2>
              <p className="text-xs text-muted-foreground">
                Tüm ilan görüşmelerin burada listelenir.
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
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
          className={`${!isMobile && !selectedChatId ? "hidden lg:flex" : ""} flex min-h-[calc(100vh-14rem)] flex-1 flex-col overflow-hidden rounded-3xl border-border/60 shadow-sm`}
        >
          {isMobile && selectedChatId && (
            <div className="border-b px-3 py-2.5">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} userId={userId} onBack={handleBack} />
          ) : (
            <div className="flex h-full items-center justify-center p-5 text-center">
              <div className="max-w-md rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
                <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-foreground">Bir konuşma seçin</h3>
                <p className="text-sm text-muted-foreground">
                  Soldaki listeden bir sohbet açarak araç sahibiyle görüşmeye başlayabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
