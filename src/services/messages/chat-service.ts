import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Chat, Message, Profile, Listing } from "@/types";
import { logger } from "@/lib/utils/logger";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Common helper to get client, defaults to browser client
 */
function getClient(injectedClient?: SupabaseClient) {
  return injectedClient || createSupabaseBrowserClient();
}

interface ProfileRow {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  role?: Profile["role"];
  user_type?: Profile["userType"];
  is_verified?: boolean | null;
  business_name?: string | null;
  business_logo_url?: string | null;
  business_slug?: string | null;
}

interface ListingRow {
  id: string;
  title: string;
  price: number;
  slug?: string | null;
  brand?: string | null;
  model?: string | null;
}

interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at?: string;
  listing?: ListingRow | null;
  buyer?: ProfileRow | null;
  seller?: ProfileRow | null;
  profiles_buyer_id?: ProfileRow[];
  profiles_seller_id?: ProfileRow[];
  last_message?: MessageRow | null;
}

/**
 * Mapping helpers to convert DB rows (snake_case) to Domain types (camelCase)
 */
function mapProfileRow(row?: ProfileRow | null): Partial<Profile> {
  if (!row) return {};
  return {
    id: row.id,
    fullName: row.full_name ?? undefined,
    phone: row.phone ?? undefined,
    city: row.city ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    userType: row.user_type,
    isVerified: row.is_verified ?? undefined,
    businessName: row.business_name ?? undefined,
    businessLogoUrl: row.business_logo_url ?? undefined,
    businessSlug: row.business_slug ?? undefined,
  };
}

function mapListingRow(row?: ListingRow | null): Partial<Listing> {
  if (!row) return {};
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    slug: row.slug ?? undefined,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
  };
}

function mapChatRow(row: ChatRow): Chat {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
    listing: mapListingRow(row.listing),
    buyer: mapProfileRow(row.buyer ?? row.profiles_buyer_id?.[0]),
    seller: mapProfileRow(row.seller ?? row.profiles_seller_id?.[0]),
    lastMessage: row.last_message ? mapMessageRow(row.last_message) : undefined
  };
}

function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at
  };
}

/**
 * Creates or retrieves a chat between a buyer and a seller for a specific listing.
 */
export async function getOrCreateChat(
  listingId: string, 
  buyerId: string, 
  sellerId: string,
  supabase?: SupabaseClient
): Promise<Chat | null> {
  const client = getClient(supabase);

  try {
    const { data: existingChat } = await client
      .from("chats")
      .select("*, listing:listings(id, title, price, slug, brand, model), buyer:profiles!buyer_id(id, full_name, avatar_url, city), seller:profiles!seller_id(id, full_name, avatar_url, city)")
      .eq("listing_id", listingId)
      .eq("buyer_id", buyerId)
      .eq("seller_id", sellerId)
      .single();

    if (existingChat) return mapChatRow(existingChat);

    const { data: newChat, error: createError } = await client
      .from("chats")
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
      .select("*, listing:listings(id, title, price, slug, brand, model), buyer:profiles!buyer_id(id, full_name, avatar_url, city), seller:profiles!seller_id(id, full_name, avatar_url, city)")
      .single();

    if (createError) {
      logger.messages.error("Chat Create Error", createError, { listingId, buyerId, sellerId });
      return null;
    }

    return mapChatRow(newChat);
  } catch (error) {
    logger.messages.error("Unexpected Chat Service Error", error);
    return null;
  }
}

/**
 * Fetches all messages for a specific chat.
 */
export async function getChatMessages(chatId: string, supabase?: SupabaseClient): Promise<Message[]> {
  const client = getClient(supabase);

  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.messages.error("Fetch Messages Error", error, { chatId });
    return [];
  }

  return (data || []).map(mapMessageRow);
}

/**
 * Sends a message in a specific chat.
 * Uses Server API when called from browser to enforce rate limits and security.
 */
export async function sendMessage(
  chatId: string, 
  senderId: string, 
  content: string,
  supabase?: SupabaseClient
): Promise<Message | null> {
  if (supabase || process.env.NODE_ENV === "test") {
    const client = supabase ?? getClient();
    const { data, error } = await supabase
      ?.from("messages")
      .insert({ chat_id: chatId, sender_id: senderId, content })
      .select("*")
      .single() ?? await client
      .from("messages")
      .insert({ chat_id: chatId, sender_id: senderId, content })
      .select("*")
      .single();

    if (error) {
      logger.messages.error("Send Message DB Error", error, { chatId });
      return null;
    }

    return mapMessageRow(data);
  }

  // If running in browser, use the Secure API Route to benefit from Rate Limiting & CSRF protection
  if (typeof window !== "undefined") {
    try {
      const endpoint = new URL("/api/messages", window.location.origin || "http://localhost").toString();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        logger.messages.error("Send Message API Error", result?.error, { chatId });
        return null;
      }
      return result.data ?? null;
    } catch (err) {
      logger.messages.error("Send Message Fetch Error", err);
      return null;
    }
  }

  // Fallback for server-side or custom client injections
  const client = getClient();

  const { data, error } = await client
    .from("messages")
    .insert({ chat_id: chatId, sender_id: senderId, content })
    .select("*")
    .single();

  if (error) {
    logger.messages.error("Send Message DB Error", error, { chatId });
    return null;
  }

  return mapMessageRow(data);
}

/**
 * Gets all chats for a specific user (either as buyer or seller).
 */
export async function getUserChats(userId: string, supabase?: SupabaseClient): Promise<Chat[]> {
  const client = getClient(supabase);

  const { data, error } = await client
    .from("chats")
    .select("*, listing:listings(id, title, price, slug, brand, model), buyer:profiles!buyer_id(id, full_name, avatar_url, city), seller:profiles!seller_id(id, full_name, avatar_url, city)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    logger.messages.error("Fetch User Chats Error", error, { userId });
    return [];
  }

  return (data || []).map(mapChatRow);
}

/**
 * Marks all unread messages in a chat as read for the current user.
 */
export async function markMessagesAsRead(chatId: string, userId: string, supabase?: SupabaseClient): Promise<boolean> {
  const client = getClient(supabase);

  const { error } = await client
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
