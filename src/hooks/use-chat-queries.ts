import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/lib/constants/api-routes";
import { queryKeys } from "@/lib/query-keys";
import type { ChatWithLastMessage, Message, SendMessageInput } from "@/types/chat";

async function fetchChats(userId: string): Promise<ChatWithLastMessage[]> {
  const res = await fetch(API_ROUTES.CHATS.BASE);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Chat listesi alınamadı.");
  }
  const json = await res.json();
  return json.data ?? [];
}

async function fetchMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(API_ROUTES.CHATS.MESSAGES(chatId));
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Mesajlar alınamadı.");
  }
  const json = await res.json();
  return json.data ?? [];
}

/**
 * Get all chats for current user — calls /api/chats (server-side, RLS-aware)
 */
export function useChats(userId: string) {
  return useQuery({
    queryKey: queryKeys.chats.list(userId),
    queryFn: () => fetchChats(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30s — realtime keeps it fresh
  });
}

/**
 * Get messages for a specific chat
 */
export function useChatMessages(chatId: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.chats.messages(chatId),
    queryFn: () => fetchMessages(chatId),
    enabled: !!chatId && !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new chat
 */
export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { listingId: string; sellerId: string; buyerId: string }) => {
      const res = await fetch(API_ROUTES.CHATS.BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: input.listingId, sellerId: input.sellerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chat oluşturulamadı.");
      return json.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.list(variables.buyerId),
      });
    },
  });
}

/**
 * Send a message with optimistic update
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const res = await fetch(API_ROUTES.CHATS.MESSAGES(input.chatId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.content, messageType: input.messageType ?? "text" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mesaj gönderilemedi.");
      return json.data as Message;
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.chats.messages(newMessage.chatId),
      });

      const previousMessages = queryClient.getQueryData<Message[]>(
        queryKeys.chats.messages(newMessage.chatId)
      );

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: newMessage.chatId,
        senderId: newMessage.senderId,
        content: newMessage.content,
        messageType: newMessage.messageType ?? "text",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(queryKeys.chats.messages(newMessage.chatId), (old) => [
        ...(old ?? []),
        optimisticMessage,
      ]);

      return { previousMessages };
    },
    onError: (_, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData<Message[]>(
          queryKeys.chats.messages(newMessage.chatId),
          context.previousMessages
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(variables.chatId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.all,
      });
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId }: { chatId: string; userId: string }) => {
      const res = await fetch(API_ROUTES.CHATS.MARK_READ(chatId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Okundu işaretlenemedi.");
      return json.data;
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(chatId),
      });
    },
  });
}
