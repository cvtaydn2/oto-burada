import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { ChatService } from "@/services/chat/chat-service";
import type { CreateChatInput, Message, SendMessageInput } from "@/types/chat";

/**
 * Get all chats for current user
 */
export function useChats(userId: string) {
  return useQuery({
    queryKey: queryKeys.chats.list(userId),
    queryFn: () => ChatService.getChatsForUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get messages for a specific chat
 */
export function useChatMessages(chatId: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.chats.messages(chatId),
    queryFn: () => ChatService.getMessages(chatId, userId),
    enabled: !!chatId && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new chat
 */
export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChatInput) => ChatService.createChat(input),
    onSuccess: (data, variables) => {
      // Invalidate chat list for the user
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.list(variables.buyerId),
      });
      // Also invalidate the specific chat if it exists
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(variables.listingId),
      });
    },
  });
}

/**
 * Send a message (optimistic update support)
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => ChatService.sendMessage(input),
    // Optimistic update
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
        messageType: newMessage.messageType || "text",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(queryKeys.chats.messages(newMessage.chatId), (old) => [
        ...(old || []),
        optimisticMessage,
      ]);

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData<Message[]>(
          queryKeys.chats.messages(newMessage.chatId),
          context.previousMessages
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation completes
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(variables.chatId),
      });
      // Also invalidate chat list for last message update
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
    mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) =>
      ChatService.markAsRead(chatId, userId),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(chatId),
      });
    },
  });
}
