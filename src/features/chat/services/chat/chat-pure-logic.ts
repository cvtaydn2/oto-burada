import type { Chat, ChatWithLastMessage, Message } from "@/types/chat";

import type { ChatRecord, MessageRecord } from "./chat-records";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates standard UUIDv4 format.
 */
export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Filters raw chat entries based on whether we include archived or active items.
 */
export function filterChatsByArchiveStatus(
  chats: ChatRecord[],
  userId: string,
  includeArchived: boolean
) {
  return (chats || []).filter((chat) => {
    const isBuyer = chat.buyer_id === userId;
    const isSeller = chat.seller_id === userId;

    if (includeArchived) {
      return (isBuyer && chat.buyer_archived) || (isSeller && chat.seller_archived);
    } else {
      return (isBuyer && !chat.buyer_archived) || (isSeller && !chat.seller_archived);
    }
  });
}

/**
 * Maps a raw database chat/message set into client DTO structure.
 */
export function mapChatRecordToOutput(chat: ChatRecord): ChatWithLastMessage {
  const messages = (chat.messages as Record<string, unknown>[]) || [];
  // Filter out deleted messages from last message preview
  const lastMessage = messages.find((m) => !m.deleted_at) || null;

  return {
    id: chat.id as string,
    listingId: chat.listing_id as string,
    buyerId: chat.buyer_id as string,
    sellerId: chat.seller_id as string,
    status: (chat.status as string) === "archived" ? "archived" : "active",
    lastMessageAt: chat.last_message_at as string,
    createdAt: chat.created_at as string,
    buyerArchived: chat.buyer_archived as boolean,
    sellerArchived: chat.seller_archived as boolean,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id as string,
          chatId: lastMessage.chat_id as string,
          senderId: lastMessage.sender_id as string,
          content: lastMessage.content as string,
          messageType: (lastMessage.message_type as "text" | "image" | "system") || "text",
          isRead: lastMessage.is_read as boolean,
          createdAt: lastMessage.created_at as string,
        }
      : undefined,
  };
}

/**
 * Maps raw chat base record to client DTO.
 */
export function mapSingleChatToOutput(chat: ChatRecord): Chat {
  return {
    id: chat.id,
    listingId: chat.listing_id || "",
    buyerId: chat.buyer_id,
    sellerId: chat.seller_id,
    status: chat.status as "active" | "archived",
    lastMessageAt: chat.last_message_at || new Date().toISOString(),
    createdAt: chat.created_at,
    buyerArchived: chat.buyer_archived || false,
    sellerArchived: chat.seller_archived || false,
  };
}

/**
 * Maps raw message records into typed Message objects.
 */
export function mapMessageRecordsToOutput(messages: MessageRecord[]): Message[] {
  return (messages || []).map((msg) => ({
    id: msg.id as string,
    chatId: msg.chat_id as string,
    senderId: msg.sender_id as string,
    content: msg.content as string,
    messageType: msg.message_type ? (msg.message_type as "text" | "image" | "system") : "text",
    isRead: msg.is_read as boolean,
    createdAt: msg.created_at as string,
  }));
}

/**
 * Validates basic bounds for insertion of message content.
 */
export function validateMessageInsertion(content: string | undefined): boolean {
  if (!content || !content.trim()) return false;
  if (content.trim().length > 2000) return false;
  return true;
}
