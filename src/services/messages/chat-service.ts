import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Chat, Message } from "@/types";
import { logger } from "@/lib/utils/logger";

/**
 * Creates or retrieves a chat between a buyer and a seller for a specific listing.
 */
export async function getOrCreateChat(listingId: string, buyerId: string, sellerId: string): Promise<Chat | null> {
  const isServer = typeof window === "undefined";
  const supabase = isServer ? await createSupabaseServerClient() : createSupabaseBrowserClient();

  try {
    // Try to find existing chat
    const { data: existingChat } = await supabase
      .from("chats")
      .select("*, listing:listings(id, title, price), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)")
      .eq("listing_id", listingId)
      .eq("buyer_id", buyerId)
      .eq("seller_id", sellerId)
      .single();

    if (existingChat) return existingChat as Chat;

    // If not found, create new
    const { data: newChat, error: createError } = await supabase
      .from("chats")
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
      .select("*, listing:listings(id, title, price), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)")
      .single();

    if (createError) {
      logger.messages.error("Chat Create Error", createError, { listingId, buyerId, sellerId });
      return null;
    }

    return newChat as unknown as Chat;
  } catch (err) {
    logger.messages.error("Unexpected Chat Service Error", err);
    return null;
  }
}

/**
 * Fetches all messages for a specific chat.
 */
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const isServer = typeof window === "undefined";
  const supabase = isServer ? await createSupabaseServerClient() : createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.messages.error("Fetch Messages Error", error, { chatId });
    return [];
  }

  return data as Message[];
}

/**
 * Sends a message in a specific chat.
 */
export async function sendMessage(chatId: string, senderId: string, content: string): Promise<Message | null> {
  const isServer = typeof window === "undefined";
  const supabase = isServer ? await createSupabaseServerClient() : createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: senderId, content })
    .select("*")
    .single();

  if (error) {
    logger.messages.error("Send Message Error", error, { chatId });
    return null;
  }

  return data as Message;
}

/**
 * Gets all chats for a specific user (either as buyer or seller).
 * Ordered by last message activity.
 */
export async function getUserChats(userId: string): Promise<Chat[]> {
  const isServer = typeof window === "undefined";
  const supabase = isServer ? await createSupabaseServerClient() : createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("chats")
    .select("*, listing:listings(id, title, price), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    logger.messages.error("Fetch User Chats Error", error, { userId });
    return [];
  }

  return data as unknown as Chat[];
}

/**
 * Marks all unread messages in a chat as read for the current user.
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<boolean> {
  const isServer = typeof window === "undefined";
  const supabase = isServer ? await createSupabaseServerClient() : createSupabaseBrowserClient();

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .neq("sender_id", userId)
    .eq("is_read", false);

  if (error) {
    logger.messages.error("Mark Read Error", error, { chatId, userId });
    return false;
  }

  return true;
}
