"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatList } from "@/components/chat/chat-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSupabase } from "@/lib/supabase/client";

export default function MessagesPage() {
  const supabase = useSupabase();
  // Use ref to keep supabase instance stable across renders
  // This prevents infinite loops in useEffect when useSupabase() returns same instance
  const supabaseRef = useRef(supabase);
  // eslint-disable-next-line react-hooks/refs
  supabaseRef.current = supabase;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Stable callback for chat selection - prevents unnecessary re-renders of ChatList
  const handleChatSelect = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);

  // Stable callback for back navigation
  const handleBack = useCallback(() => {
    setSelectedChatId(null);
  }, []);

  useEffect(() => {
    // Use ref to ensure stable supabase reference
    const client = supabaseRef.current;

    // Fetch user on mount
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await client.auth.getUser();
        setUser(authUser ? { id: authUser.id } : null);
      } catch {
        setUser(null);
      } finally {
        setIsAuthResolved(true);
      }
    };

    void fetchUser();
  }, []); // Empty deps - only run on mount

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

  if (!user) {
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
              userId={user.id}
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
            <ChatWindow chatId={selectedChatId} userId={user.id} onBack={handleBack} />
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
