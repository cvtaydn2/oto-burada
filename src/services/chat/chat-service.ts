import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  type Chat,
  type ChatWithLastMessage,
  type CreateChatInput,
  type Message,
  type SendMessageInput,
} from "@/types/chat";

export class ChatService {
  /**
   * Get all chats for a user with last message preview
   */
  static async getChatsForUser(userId: string): Promise<ChatWithLastMessage[]> {
    const admin = createSupabaseAdminClient();

    // Fetch chats — exclude archived ones for this user
    const { data: chats, error: chatsError } = await admin
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
        // Only show chats that are NOT archived by this user
        if (chat.buyer_id === userId) return !chat.buyer_archived;
        if (chat.seller_id === userId) return !chat.seller_archived;
        return true;
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
   */
  static async createChat(input: CreateChatInput): Promise<Chat> {
    const admin = createSupabaseAdminClient();

    const { data: existingChat, error: searchError } = await admin
      .from("chats")
      .select("id, status, buyer_archived, seller_archived")
      .eq("listing_id", input.listingId)
      .eq("buyer_id", input.buyerId)
      .eq("seller_id", input.sellerId)
      .single();

    if (searchError && searchError.code !== "PGRST116") {
      throw new Error(`Chat aranırken hata oluştu: ${searchError.message}`);
    }

    if (existingChat) {
      // Return existing chat if active
      if (existingChat.status === "active") {
        return {
          id: existingChat.id,
          listingId: input.listingId,
          buyerId: input.buyerId,
          sellerId: input.sellerId,
          status: existingChat.status as "active" | "archived",
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          buyerArchived:
            (existingChat as unknown as { buyer_archived: boolean }).buyer_archived || false,
          sellerArchived:
            (existingChat as unknown as { seller_archived: boolean }).seller_archived || false,
        };
      }
    }

    const { data: chat, error: insertError } = await admin
      .from("chats")
      .insert({
        listing_id: input.listingId,
        buyer_id: input.buyerId,
        seller_id: input.sellerId,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Chat oluşturulamadı: ${insertError.message}`);
    }

    // Create a system message for chat start
    await admin.from("messages").insert({
      chat_id: chat.id,
      sender_id: input.buyerId,
      content: "Chat başlatıldı.",
      message_type: "system",
      is_read: true,
    });

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
   */
  static async getMessages(chatId: string, userId: string): Promise<Message[]> {
    const admin = createSupabaseAdminClient();

    // Verify user is participant
    const { data: chat, error: chatError } = await admin
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (chatError) {
      throw new Error("Chat bulunamadı veya erişim izniniz yok.");
    }

    const { data: messages, error: messagesError } = await admin
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
   */
  static async sendMessage(input: SendMessageInput): Promise<Message> {
    const admin = createSupabaseAdminClient();

    // Verify chat exists and user is participant
    const { data: chat, error: chatError } = await admin
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
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentMessageCount, error: countError } = await admin
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

    const { data: message, error: insertError } = await admin
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
      throw new Error(`Mesaj gönderilemedi: ${insertError.message}`);
    }

    // Update chat's last_message_at
    await admin
      .from("chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", input.chatId);

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
   */
  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const admin = createSupabaseAdminClient();

    const { error } = await admin
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", userId);

    if (error) {
      throw new Error(`Mesaj silinemedi: ${error.message}`);
    }

    return true;
  }

  /**
   * Archive or unarchive a chat for a specific user
   */
  static async archiveChat(chatId: string, userId: string, archive: boolean): Promise<boolean> {
    const admin = createSupabaseAdminClient();

    const { error } = await admin.rpc("toggle_chat_archive", {
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
   */
  static async markAsRead(
    chatId: string,
    userId: string
  ): Promise<{ success: boolean; updatedCount: number }> {
    const admin = createSupabaseAdminClient();

    // Verify user is participant
    const { data: chat, error: chatError } = await admin
      .from("chats")
      .select("id, buyer_id, seller_id")
      .eq("id", chatId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (chatError) {
      throw new Error("Chat bulunamadı veya erişim izniniz yok.");
    }

    const { data, error: updateError } = await admin
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
}
