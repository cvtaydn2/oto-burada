"use server";

/**
 * Chat Server Actions
 *
 * Modern server actions pattern for chat operations.
 * Replaces legacy ChatService class-based pattern.
 *
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */

import {
  createNewChat,
  deleteChatMessage,
  getChatMessages,
  getUserChats,
  markChatMessagesAsRead,
  sendChatMessage,
  toggleChatArchive,
} from "@/services/chat/chat-logic";
import type {
  Chat,
  ChatWithLastMessage,
  CreateChatInput,
  Message,
  SendMessageInput,
} from "@/types/chat";

/**
 * Get all chats for a user with last message preview
 *
 * @param userId - User ID
 * @param includeArchived - Whether to include archived chats
 * @returns Array of chats with last message
 */
export async function getChatsForUserAction(
  userId: string,
  includeArchived = false
): Promise<ChatWithLastMessage[]> {
  return getUserChats(userId, includeArchived);
}

/**
 * Create a new chat between buyer and seller for a listing
 *
 * @param input - Chat creation parameters
 * @returns Created chat object
 */
export async function createChatAction(input: CreateChatInput): Promise<Chat> {
  return createNewChat(input);
}

/**
 * Get all messages for a chat
 *
 * @param chatId - Chat ID
 * @param userId - User ID for authorization
 * @returns Array of messages
 */
export async function getMessagesAction(chatId: string, userId: string): Promise<Message[]> {
  return getChatMessages(chatId, userId);
}

/**
 * Send a message to a chat
 *
 * @param input - Message sending parameters
 * @returns Created message object
 */
export async function sendMessageAction(input: SendMessageInput): Promise<Message> {
  return sendChatMessage(input);
}

/**
 * Delete a message (soft delete)
 *
 * @param messageId - Message ID
 * @param userId - User ID for authorization
 * @returns Success boolean
 */
export async function deleteMessageAction(messageId: string, userId: string): Promise<boolean> {
  return deleteChatMessage(messageId, userId);
}

/**
 * Archive or unarchive a chat for a specific user
 *
 * @param chatId - Chat ID
 * @param userId - User ID
 * @param archive - Whether to archive (true) or unarchive (false)
 * @returns Success boolean
 */
export async function archiveChatAction(
  chatId: string,
  userId: string,
  archive: boolean
): Promise<boolean> {
  return toggleChatArchive(chatId, userId, archive);
}

/**
 * Mark all messages in a chat as read for a user
 *
 * @param chatId - Chat ID
 * @param userId - User ID
 * @returns Success status and updated count
 */
export async function markAsReadAction(
  chatId: string,
  userId: string
): Promise<{ success: boolean; updatedCount: number }> {
  return markChatMessagesAsRead(chatId, userId);
}
