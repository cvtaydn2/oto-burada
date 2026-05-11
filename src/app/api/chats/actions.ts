"use server";

import {
  createNewChat,
  deleteChatMessage,
  getChatMessages,
  getUserChats,
  markChatMessagesAsRead,
  sendChatMessage,
  toggleChatArchive,
} from "@/features/chat/services/chat-logic";
import type {
  Chat,
  ChatWithLastMessage,
  CreateChatInput,
  Message,
  SendMessageInput,
} from "@/types/chat";

async function getServerClient() {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  return createSupabaseServerClient();
}

async function verifyAuth() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Yetkilendirme başarısız.");
  }
  return user;
}

export async function getChatsForUserAction(
  userId: string,
  includeArchived = false
): Promise<ChatWithLastMessage[]> {
  const user = await verifyAuth();
  if (user.id !== userId) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return getUserChats(userId, includeArchived);
}

export async function createChatAction(input: CreateChatInput): Promise<Chat> {
  const user = await verifyAuth();
  if (input.buyerId !== user.id) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return createNewChat(input);
}

export async function getMessagesAction(chatId: string, userId: string): Promise<Message[]> {
  const user = await verifyAuth();
  if (user.id !== userId) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return getChatMessages(chatId, userId);
}

export async function sendMessageAction(input: SendMessageInput): Promise<Message> {
  const user = await verifyAuth();
  if (input.senderId !== user.id) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return sendChatMessage(input);
}

export async function deleteMessageAction(messageId: string, userId: string): Promise<boolean> {
  const user = await verifyAuth();
  if (user.id !== userId) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return deleteChatMessage(messageId, userId);
}

export async function archiveChatAction(
  chatId: string,
  userId: string,
  archive: boolean
): Promise<boolean> {
  const user = await verifyAuth();
  if (user.id !== userId) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return toggleChatArchive(chatId, userId, archive);
}

export async function markAsReadAction(
  chatId: string,
  userId: string
): Promise<{ success: boolean; updatedCount: number }> {
  const user = await verifyAuth();
  if (user.id !== userId) {
    throw new Error("Bu kaynağa erişim yetkiniz yok.");
  }
  return markChatMessagesAsRead(chatId, userId);
}
