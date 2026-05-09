"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import type { Chat, ChatWithLastMessage, Message } from "@/types/chat";

const chatQueryKeys = {
  all: ["chats"] as const,
  list: (userId: string, showArchived: boolean) => ["chats", userId, showArchived] as const,
  messages: (chatId: string) => ["chat-messages", chatId] as const,
};

function getErrorMessage(error: { message?: string } | undefined, fallback: string) {
  return error?.message?.trim() ? error.message : fallback;
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { listingId: string; sellerId: string; buyerId: string }) => {
      const response = await ApiClient.request<Chat>(API_ROUTES.CHATS.BASE, {
        method: "POST",
        body: JSON.stringify({
          listingId: vars.listingId,
          sellerId: vars.sellerId,
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(getErrorMessage(response.error, "Sohbet başlatılamadı."));
      }

      return response.data;
    },
    onSuccess: async (_chat, variables) => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: chatQueryKeys.list(variables.buyerId, false),
      });
    },
  });
}

export function useChats(userId: string, showArchived: boolean = false) {
  return useQuery({
    queryKey: chatQueryKeys.list(userId, showArchived),
    queryFn: async (): Promise<ChatWithLastMessage[]> => {
      const path = `${API_ROUTES.CHATS.BASE}?archived=${showArchived ? "true" : "false"}`;
      const response = await ApiClient.request<ChatWithLastMessage[]>(path);

      if (!response.success) {
        throw new Error(getErrorMessage(response.error, "Sohbet listesi alınamadı."));
      }

      return response.data ?? [];
    },
    enabled: Boolean(userId),
  });
}

export function useChatMessages(chatId: string, userId?: string) {
  return useQuery({
    queryKey: chatQueryKeys.messages(chatId),
    queryFn: async (): Promise<Message[]> => {
      const response = await ApiClient.request<Message[]>(API_ROUTES.CHATS.MESSAGES(chatId));

      if (!response.success) {
        throw new Error(getErrorMessage(response.error, "Mesajlar alınamadı."));
      }

      return response.data ?? [];
    },
    enabled: Boolean(chatId) && Boolean(userId),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { chatId: string; messageId: string }) => {
      const response = await ApiClient.request<boolean>(
        `${API_ROUTES.CHATS.MESSAGES(vars.chatId)}?messageId=${encodeURIComponent(vars.messageId)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.success) {
        throw new Error(getErrorMessage(response.error, "Mesaj silinemedi."));
      }

      return response.data ?? false;
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(variables.chatId) });
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });
}

export function useMarkAsRead(chatId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; updatedCount: number }> => {
      if (!chatId) {
        throw new Error("Okundu işaretlenecek sohbet bulunamadı.");
      }

      const response = await ApiClient.request<{ success: boolean; updatedCount: number }>(
        API_ROUTES.CHATS.MARK_READ(chatId),
        {
          method: "PATCH",
        }
      );

      if (!response.success || !response.data) {
        throw new Error(getErrorMessage(response.error, "Mesajlar okundu işaretlenemedi."));
      }

      return response.data;
    },
    onSuccess: async () => {
      if (chatId) {
        await queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(chatId) });
      }
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { chatId: string; senderId?: string; content: string }) => {
      const response = await ApiClient.request<Message>(API_ROUTES.CHATS.MESSAGES(vars.chatId), {
        method: "POST",
        body: JSON.stringify({
          content: vars.content,
          messageType: "text",
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(getErrorMessage(response.error, "Mesaj gönderilemedi."));
      }

      return response.data;
    },
    onMutate: async (variables) => {
      const queryKey = chatQueryKeys.messages(variables.chatId);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: variables.chatId,
        senderId: variables.senderId || "current-user",
        content: variables.content,
        messageType: "text",
        isRead: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(queryKey, (old) =>
        old ? [...old, optimisticMessage] : [optimisticMessage]
      );

      return { queryKey, previousMessages };
    },
    onError: async (error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
      toast.error(getErrorMessage({ message: (error as Error).message }, "Mesaj gönderilemedi."));
    },
    onSuccess: async (_message, variables) => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(variables.chatId) });
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });
}

export function useArchiveChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { chatId: string; archive: boolean }) => {
      const response = await ApiClient.request<boolean>(
        `${API_ROUTES.CHATS.DETAIL(vars.chatId)}/archive`,
        {
          method: "POST",
          body: JSON.stringify({ archive: vars.archive }),
        }
      );

      if (!response.success) {
        throw new Error(getErrorMessage(response.error, "Sohbet arşivlenemedi."));
      }

      return response.data ?? false;
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(variables.chatId) });
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });
}
