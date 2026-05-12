import { createSupabaseServerClient } from "@/lib/server";
import type { Database } from "@/types/supabase";

export type ChatRecord = Database["public"]["Tables"]["chats"]["Row"] & {
  messages?: Database["public"]["Tables"]["messages"]["Row"][];
};

export type MessageRecord = Database["public"]["Tables"]["messages"]["Row"];

/**
 * Fetches all chats involving a specific user with an optional archived toggle.
 */
export async function fetchUserChats(userId: string): Promise<ChatRecord[] | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
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
        message_type,
        created_at,
        deleted_at
      )
    `
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });

  if (error) throw error;
  return data;
}

/**
 * Atomically creates a chat using the database RPC.
 */
export async function createChatAtomic(input: {
  listingId: string;
  buyerId: string;
  sellerId: string;
}): Promise<string | unknown> {
  const supabase = await createSupabaseServerClient();

  const { data: chatId, error } = await supabase.rpc("create_chat_atomic", {
    p_listing_id: input.listingId,
    p_buyer_id: input.buyerId,
    p_seller_id: input.sellerId,
    p_system_message: "Chat başlatıldı.",
  });

  if (error) throw error;
  return chatId;
}

/**
 * Fetches a single chat by its ID.
 */
export async function fetchChatById(chatId: string): Promise<ChatRecord> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chats")
    .select(
      "id, listing_id, buyer_id, seller_id, status, last_message_at, created_at, buyer_archived, seller_archived"
    )
    .eq("id", chatId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Checks if user is a participant in the chat.
 */
export async function verifyChatParticipation(
  chatId: string,
  userId: string
): Promise<
  Pick<Database["public"]["Tables"]["chats"]["Row"], "id" | "buyer_id" | "seller_id" | "status">
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chats")
    .select("id, buyer_id, seller_id, status")
    .eq("id", chatId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches non-deleted messages for a specific chat.
 */
export async function fetchChatMessages(chatId: string): Promise<MessageRecord[] | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, sender_id, content, is_read, message_type, created_at, deleted_at")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Gets the count of messages by a user in a specific chat within the last hour.
 */
export async function getRecentUserMessageCount(chatId: string, userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId)
    .eq("sender_id", userId)
    .gt("created_at", oneHourAgo);

  if (error) throw error;
  return count || 0;
}

/**
 * Inserts a message into the chat.
 */
export async function insertChatMessageRecord(params: {
  chatId: string;
  senderId: string;
  content: string;
  messageType?: "text" | "image" | "system";
}): Promise<MessageRecord> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: params.chatId,
      sender_id: params.senderId,
      content: params.content.trim(),
      message_type: params.messageType || "text",
      is_read: false,
    })
    .select("id, chat_id, sender_id, content, is_read, message_type, created_at, deleted_at")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Calls the RPC to soft delete a message.
 */
export async function rpcSoftDeleteMessage(messageId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("soft_delete_message", {
    p_message_id: messageId,
    p_user_id: userId,
  });

  if (error) throw error;
  return !!data;
}

/**
 * Calls the RPC to archive/unarchive a chat.
 */
export async function rpcToggleChatArchive(chatId: string, userId: string, archive: boolean) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("toggle_chat_archive", {
    p_chat_id: chatId,
    p_user_id: userId,
    p_archive: archive,
  });

  if (error) throw error;
  return true;
}

/**
 * Updates message read status in DB.
 */
export async function markMessagesAsReadInDb(chatId: string, senderId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("sender_id", senderId)
    .eq("is_read", false)
    .select("id");

  if (error) throw error;
  return data?.length || 0;
}
