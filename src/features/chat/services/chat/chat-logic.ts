/**
 * Chat Business Logic
 *
 * Pure functions for chat operations.
 * Migrated from class-based ChatService pattern.
 *
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */

import { createSupabaseServerClient } from "@/features/shared/lib/server";
import {
  type Chat,
  type ChatWithLastMessage,
  type CreateChatInput,
  type Message,
  type SendMessageInput,
} from "@/types/chat";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Get all chats for a user with last message preview
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function getUserChats(
  userId: string,
  includeArchived = false
): Promise<ChatWithLastMessage[]> {
  if (!isValidUuid(userId)) {
    throw new Error("Geçersiz kullanıcı ID formatı");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch chats — exclude archived ones for this user
  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select(
      `
      id,
      listing_id,
      buyer_id,
      seller_id,
      status,
      last_message_at,
      created_at,
      buyer_archived,
      seller_archived,
      messages (
        id,
        chat_id,
        sender_id,
        content,
        is_read,
        created_at,
        deleted_at
      )
    `
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });

  if (chatsError) {
    throw new Error(`Chat listesi alınamadı: ${chatsError.message}`);
  }

  return (chats || [])
    .filter((chat) => {
      const isBuyer = chat.buyer_id === userId;
      const isSeller = chat.seller_id === userId;

      // If including archived, we ONLY show archived chats.
      // If NOT including archived, we ONLY show active chats.
      if (includeArchived) {
        return (isBuyer && chat.buyer_archived) || (isSeller && chat.seller_archived);
      } else {
        return (isBuyer && !chat.buyer_archived) || (isSeller && !chat.seller_archived);
      }
    })
    .map((chat: Record<string, unknown>) => {
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
              id: (lastMessage as Record<string, unknown>).id as string,
              chatId: (lastMessage as Record<string, unknown>).chat_id as string,
              senderId: (lastMessage as Record<string, unknown>).sender_id as string,
              content: (lastMessage as Record<string, unknown>).content as string,
              // message_type was added in migration 0068 — default to "text" for schema safety
              messageType: "text" as const,
              isRead: (lastMessage as Record<string, unknown>).is_read as boolean,
              createdAt: (lastMessage as Record<string, unknown>).created_at as string,
            }
          : undefined,
      };
    });
}

/**
 * Create a new chat between buyer and seller for a listing
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function createNewChat(input: CreateChatInput): Promise<Chat> {
  const supabase = await createSupabaseServerClient();

  const { data: chatId, error } = await supabase.rpc("create_chat_atomic", {
    p_listing_id: input.listingId,
    p_buyer_id: input.buyerId,
    p_seller_id: input.sellerId,
    p_system_message: "Chat başlatıldı.",
  });

  if (error) {
    throw new Error(`Chat oluşturulamadı: ${error.message}`);
  }

  const { data: chat, error: fetchError } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single();

  if (fetchError) {
    throw new Error(`Chat bilgileri alınamadı: ${fetchError.message}`);
  }

  return {
    id: chat.id,
    listingId: chat.listing_id,
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
 * Get all messages for a chat
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function getChatMessages(chatId: string, userId: string): Promise<Message[]> {
  const supabase = await createSupabaseServerClient();

  // Verify user is participant
  const { error: chatError } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .single();

  if (chatError) {
    throw new Error("Chat bulunamadı veya erişim izniniz yok.");
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(`Mesajlar alınamadı: ${messagesError.message}`);
  }

  return (messages || []).map((msg: Record<string, unknown>) => ({
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
 * Send a message to a chat
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function sendChatMessage(input: SendMessageInput): Promise<Message> {
  const supabase = await createSupabaseServerClient();

  // Verify chat exists and user is participant
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, buyer_id, seller_id, status")
    .eq("id", input.chatId)
    .or(`buyer_id.eq.${input.senderId},seller_id.eq.${input.senderId}`)
    .single();

  if (chatError) {
    throw new Error("Chat bulunamadı veya erişim izniniz yok.");
  }

  if (chat.status !== "active") {
    throw new Error("Bu chat aktif değil.");
  }

  // Simple rate limiting check: max 100 messages per chat in last hour
  // ── NOTE: Issue CHAT-01 - Rate Limit Now Enforced at Database Level ──────
  // Database trigger 'enforce_message_rate_limit' provides atomic protection.
  // This application-level check is kept as a fast-fail optimization to avoid
  // unnecessary database round-trips, but the trigger is the authoritative control.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentMessageCount, error: countError } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_id", input.chatId)
    .eq("sender_id", input.senderId)
    .gt("created_at", oneHourAgo);

  if (countError) {
    throw new Error(`Rate limit kontrolü başarısız: ${countError.message}`);
  }

  if (recentMessageCount && recentMessageCount >= 100) {
    throw new Error("Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.");
  }

  // ── BUG FIX: Issue CHAT-02 - Handle Rate Limit Exception from Trigger ──
  // Database trigger will throw 'rate_limit_exceeded' exception if limit is hit
  let message;
  try {
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        chat_id: input.chatId,
        sender_id: input.senderId,
        content: input.content.trim(),
        message_type: input.messageType || "text",
        is_read: false,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a rate limit error from trigger
      if (insertError.message?.includes("rate_limit_exceeded")) {
        throw new Error("Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.");
      }
      throw new Error(`Mesaj gönderilemedi: ${insertError.message}`);
    }

    message = data;
  } catch (err) {
    const error = err as Error;
    if (error.message?.includes("rate_limit_exceeded")) {
      throw new Error("Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.");
    }
    throw error;
  }

  // Redundant manual update removed — DB trigger 'messages_touch_chat_last_message_at' handles this atomically.

  return {
    id: message.id,
    chatId: message.chat_id,
    senderId: message.sender_id,
    content: message.content,
    messageType: message.message_type,
    isRead: message.is_read,
    createdAt: message.created_at,
    deletedAt: message.deleted_at,
  };
}

/**
 * Delete a message (soft delete)
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function deleteChatMessage(messageId: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data: success, error } = await supabase.rpc("soft_delete_message", {
    p_message_id: messageId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Mesaj silinemedi: ${error.message}`);
  }

  return !!success;
}

/**
 * Archive or unarchive a chat for a specific user
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function toggleChatArchive(
  chatId: string,
  userId: string,
  archive: boolean
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("toggle_chat_archive", {
    p_chat_id: chatId,
    p_user_id: userId,
    p_archive: archive,
  });

  if (error) {
    throw new Error(`Chat arşivlenemedi: ${error.message}`);
  }

  return true;
}

/**
 * Mark all messages in a chat as read for a user
 *
 * Pure function - no class wrapper
 * Migration: Phase 28.5 - Legacy Service Patterns Migration
 */
export async function markChatMessagesAsRead(
  chatId: string,
  userId: string
): Promise<{ success: boolean; updatedCount: number }> {
  const supabase = await createSupabaseServerClient();

  // Verify user is participant
  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, buyer_id, seller_id")
    .eq("id", chatId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .single();

  if (chatError) {
    throw new Error("Chat bulunamadı veya erişim izniniz yok.");
  }

  const { data, error: updateError } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("sender_id", chat.seller_id === userId ? chat.buyer_id : chat.seller_id)
    .eq("is_read", false)
    .select("id");

  if (updateError) {
    throw new Error(`Mesajlar okundu işaretlenemedi: ${updateError.message}`);
  }

  return {
    success: true,
    updatedCount: data?.length || 0,
  };
}
