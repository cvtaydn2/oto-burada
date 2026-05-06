import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCsrfToken } from "@/components/providers/csrf-provider";
import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { queryKeys } from "@/lib/query-keys";
import type { ChatWithLastMessage, Message, SendMessageInput } from "@/types/chat";

async function fetchChats(archived = false): Promise<ChatWithLastMessage[]> {
  const response = await ApiClient.request<ChatWithLastMessage[]>(
    `${API_ROUTES.CHATS.BASE}${archived ? "?archived=true" : ""}`
  );

  if (!response.success) {
    throw new Error(response.error?.message || "Chat listesi alınamadı.");
  }

  return Array.isArray(response.data) ? response.data : [];
}

async function fetchMessages(chatId: string): Promise<Message[]> {
  const response = await ApiClient.request<Message[]>(API_ROUTES.CHATS.MESSAGES(chatId));

  if (!response.success) {
    throw new Error(response.error?.message || "Mesajlar alınamadı.");
  }

  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get all chats for current user — calls /api/chats (server-side, RLS-aware)
 */
export function useChats(userId: string, archived = false) {
  return useQuery({
    queryKey: [...queryKeys.chats.list(userId), { archived }],
    queryFn: () => fetchChats(archived),
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
  const { refresh: refreshCsrfToken } = useCsrfToken();

  return useMutation({
    mutationFn: async (input: { listingId: string; sellerId: string; buyerId: string }) => {
      const createPayload = JSON.stringify({
        listingId: input.listingId,
        sellerId: input.sellerId,
      });

      const response = await ApiClient.request<{ id: string }>(API_ROUTES.CHATS.BASE, {
        method: "POST",
        body: createPayload,
      });

      if (response.success && response.data) {
        return response.data;
      }

      const errorMessage = response.error?.message?.toLowerCase() || "";
      const isCsrfTokenMismatch = errorMessage.includes("csrf token");

      if (isCsrfTokenMismatch) {
        const freshToken = await refreshCsrfToken();

        if (freshToken) {
          const retryResponse = await ApiClient.request<{ id: string }>(API_ROUTES.CHATS.BASE, {
            method: "POST",
            body: createPayload,
            headers: {
              "x-csrf-token": freshToken,
            },
          });

          if (retryResponse.success && retryResponse.data) {
            return retryResponse.data;
          }

          throw new Error(retryResponse.error?.message || "Chat oluşturulamadı.");
        }
      }

      throw new Error(response.error?.message || "Chat oluşturulamadı.");
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
      const response = await ApiClient.request<Message>(API_ROUTES.CHATS.MESSAGES(input.chatId), {
        method: "POST",
        body: JSON.stringify({ content: input.content, messageType: input.messageType ?? "text" }),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Mesaj gönderilemedi.");
      }

      return response.data;
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
      // Invalidate lists to update last message preview
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.lists(),
      });
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkAsRead(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await ApiClient.request<{ success: boolean }>(
        API_ROUTES.CHATS.MARK_READ(chatId),
        {
          method: "POST",
        }
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Okundu işaretlenemedi.");
      }

      return response.data;
    },
    onSuccess: () => {
      // Update local messages cache to mark all as read
      queryClient.setQueryData<Message[]>(queryKeys.chats.messages(chatId), (old) => {
        if (!old) return old;
        return old.map((msg) => ({ ...msg, isRead: true }));
      });
      // Also invalidate chat list to update unread counts
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
  });
}

/**
 * Delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      const response = await ApiClient.request<{ success: boolean }>(
        `${API_ROUTES.CHATS.MESSAGES(chatId)}?messageId=${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Mesaj silinemedi.");
      }

      return response.data;
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(chatId),
      });
    },
  });
}

/**
 * Archive a chat
 */
export function useArchiveChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, archive }: { chatId: string; archive: boolean }) => {
      const response = await ApiClient.request<{ success: boolean }>(
        `${API_ROUTES.CHATS.BASE}/${chatId}/archive`,
        {
          method: "POST",
          body: JSON.stringify({ archive }),
        }
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Chat arşivlenemedi.");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.lists(),
      });
    },
  });
}
