"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  archiveChatAction,
  createChatAction,
  deleteMessageAction,
  getChatsForUserAction,
  getMessagesAction,
  markAsReadAction,
  sendMessageAction,
} from "@/app/api/chats/actions";
import type { Message } from "@/types/chat";

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
      return createChatAction({
        listingId: vars.listingId,
        buyerId: vars.buyerId,
        sellerId: vars.sellerId,
      });
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
    queryFn: () => getChatsForUserAction(userId, showArchived),
    enabled: Boolean(userId),
  });
}

export function useChatMessages(chatId: string, userId?: string) {
  return useQuery({
    queryKey: chatQueryKeys.messages(chatId),
    queryFn: () => getMessagesAction(chatId, userId!),
    enabled: Boolean(chatId) && Boolean(userId),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { chatId: string; messageId: string; userId: string }) => {
      return deleteMessageAction(vars.messageId, vars.userId);
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(variables.chatId),
      });
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });
}

export function useMarkAsRead(chatId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      chatId: string;
      userId: string;
    }): Promise<{
      success: boolean;
      updatedCount: number;
    }> => {
      return markAsReadAction(vars.chatId, vars.userId);
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
    mutationFn: async (vars: { chatId: string; senderId: string; content: string }) => {
      return sendMessageAction({
        chatId: vars.chatId,
        senderId: vars.senderId,
        content: vars.content,
        messageType: "text",
      });
    },
    onMutate: async (variables) => {
      const queryKey = chatQueryKeys.messages(variables.chatId);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: variables.chatId,
        senderId: variables.senderId,
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
    mutationFn: async (vars: { chatId: string; userId: string; archive: boolean }) => {
      return archiveChatAction(vars.chatId, vars.userId, vars.archive);
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(variables.chatId) });
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });
}
