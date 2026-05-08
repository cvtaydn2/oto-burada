import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ChatWithLastMessage, Message } from "@/types/chat";

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { listingId: string; sellerId: string; buyerId: string }) => {
      return { id: "mock-" + vars.listingId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useChats(userId: string, showArchived: boolean = false) {
  return useQuery({
    queryKey: ["chats", userId, showArchived],
    queryFn: async (): Promise<ChatWithLastMessage[]> => {
      return [];
    },
    enabled: !!userId,
  });
}

export function useChatMessages(chatId: string, _userId?: string) {
  if (_userId) {
  }
  return useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async (): Promise<Message[]> => {
      return [];
    },
    enabled: !!chatId,
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_vars: { chatId: string; messageId: string }) => {
      if (_vars) {
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });
}

export function useMarkAsRead(_chatId?: string) {
  if (_chatId) {
  }
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_vars: { chatId: string; senderId?: string; content: string }) => {
      if (_vars) {
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });
}

export function useArchiveChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_vars: { chatId: string; archive: boolean }) => {
      if (_vars) {
      }
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useChatRealtime(_options?: {
  chatId?: string;
  userId?: string;
  onMessage?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}) {
  if (_options) {
  }
  return {
    subscribe: () => {},
    unsubscribe: () => {},
    sendTyping: (_typing?: boolean) => {
      if (_typing) {
      }
    },
  };
}

export function useErrorCapture(context?: string) {
  return {
    captureError: (error: unknown, source?: string, extra?: Record<string, unknown>) => {
      console.error(`[ErrorCapture:${context}]`, { error, source, extra });
    },
    captureFailure: (name: string, message: string, extra?: Record<string, unknown>) => {
      console.warn(`[FailureCapture:${context}] ${name}:`, { message, extra });
    },
    captureSuccess: (name: string, data?: Record<string, unknown>) => {
      console.log(`[SuccessCapture:${context}] ${name}:`, data);
    },
  };
}

export default useErrorCapture;
