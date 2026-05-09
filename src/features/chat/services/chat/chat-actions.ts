import {
  type Chat,
  type ChatWithLastMessage,
  type CreateChatInput,
  type Message,
  type SendMessageInput,
} from "@/types/chat";

import {
  filterChatsByArchiveStatus,
  isValidUuid,
  mapChatRecordToOutput,
  mapMessageRecordsToOutput,
  mapSingleChatToOutput,
} from "./chat-pure-logic";
import {
  createChatAtomic,
  fetchChatById,
  fetchChatMessages,
  fetchUserChats,
  getRecentUserMessageCount,
  insertChatMessageRecord,
  markMessagesAsReadInDb,
  rpcSoftDeleteMessage,
  rpcToggleChatArchive,
  verifyChatParticipation,
} from "./chat-records";

/**
 * Get all chats for a user with last message preview.
 */
export async function getUserChats(
  userId: string,
  includeArchived = false
): Promise<ChatWithLastMessage[]> {
  if (!isValidUuid(userId)) {
    throw new Error("Geçersiz kullanıcı ID formatı");
  }

  try {
    const rawChats = await fetchUserChats(userId);
    const filtered = filterChatsByArchiveStatus(rawChats || [], userId, includeArchived);
    return filtered.map(mapChatRecordToOutput);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    throw new Error(`Chat listesi alınamadı: ${message}`);
  }
}

/**
 * Create a new chat between buyer and seller for a listing.
 */
export async function createNewChat(input: CreateChatInput): Promise<Chat> {
  try {
    const chatId = await createChatAtomic({
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
    });

    const chat = await fetchChatById(chatId as string);
    return mapSingleChatToOutput(chat);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    throw new Error(
      message.includes("Chat bilgileri") ? message : `Chat oluşturulamadı: ${message}`
    );
  }
}

/**
 * Get all messages for a chat.
 */
export async function getChatMessages(chatId: string, userId: string): Promise<Message[]> {
  try {
    // Confirm access permissions
    await verifyChatParticipation(chatId, userId);
    const messages = await fetchChatMessages(chatId);
    return mapMessageRecordsToOutput(messages || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    if (message.includes("JSON object requested")) {
      throw new Error("Chat bulunamadı veya erişim izniniz yok.");
    }
    throw new Error(`Mesajlar alınamadı: ${message}`);
  }
}

/**
 * Send a message to a chat with local rate limit protection.
 */
export async function sendChatMessage(input: SendMessageInput): Promise<Message> {
  try {
    const chat = await verifyChatParticipation(input.chatId, input.senderId);
    if (chat.status !== "active") {
      throw new Error("Bu chat aktif değil.");
    }

    // Perform high-level fast-fail rate limit count check
    const recentCount = await getRecentUserMessageCount(input.chatId, input.senderId);
    if (recentCount >= 100) {
      throw new Error("Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.");
    }

    // Perform row insertion which relies on DB level trigger safety
    const data = await insertChatMessageRecord({
      chatId: input.chatId,
      senderId: input.senderId,
      content: input.content.trim(),
      messageType: input.messageType,
    });

    return {
      id: data.id,
      chatId: data.chat_id,
      senderId: data.sender_id,
      content: data.content,
      messageType: (data.message_type as "text" | "image" | "system") || "text",
      isRead: data.is_read,
      createdAt: data.created_at,
      deletedAt: data.deleted_at || undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    if (message.includes("rate_limit_exceeded")) {
      throw new Error("Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.");
    }
    if (message.includes("JSON object requested")) {
      throw new Error("Chat bulunamadı veya erişim izniniz yok.");
    }
    throw err;
  }
}

/**
 * Soft deletes a message for an authorized user.
 */
export async function deleteChatMessage(messageId: string, userId: string): Promise<boolean> {
  try {
    return await rpcSoftDeleteMessage(messageId, userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    throw new Error(`Mesaj silinemedi: ${message}`);
  }
}

/**
 * Toggles standard chat archiving via RPC call.
 */
export async function toggleChatArchive(
  chatId: string,
  userId: string,
  archive: boolean
): Promise<boolean> {
  try {
    return await rpcToggleChatArchive(chatId, userId, archive);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    throw new Error(`Chat arşivlenemedi: ${message}`);
  }
}

/**
 * Marks inbound chat messages read.
 */
export async function markChatMessagesAsRead(
  chatId: string,
  userId: string
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    const chat = await verifyChatParticipation(chatId, userId);
    const targetSender = chat.seller_id === userId ? chat.buyer_id : chat.seller_id;
    const count = await markMessagesAsReadInDb(chatId, targetSender);

    return {
      success: true,
      updatedCount: count,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    if (message.includes("JSON object requested")) {
      throw new Error("Chat bulunamadı veya erişim izniniz yok.");
    }
    throw new Error(`Mesajlar okundu işaretlenemedi: ${message}`);
  }
}
