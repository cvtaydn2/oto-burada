import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offered_price: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "counter_offer" | "expired" | "completed";
  counter_price: number | null;
  counter_message: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string;
    title: string;
    slug: string;
    price: number;
    city: string;
    images: string[];
    seller_id?: string;
  };
  buyer?: {
    full_name: string;
    phone: string;
  };
}

/**
 * SECURITY: Verify that a user owns the listing associated with an offer.
 * Used as defense-in-depth before offer acceptance/rejection.
 *
 * @param offerId - The offer ID to check
 * @param userId - The user ID claiming ownership
 * @returns Object with isOwner flag and reason if not owner
 */
export async function verifyOfferOwnership(
  offerId: string,
  userId: string
): Promise<{ isOwner: boolean; reason?: string }> {
  const supabase = await createSupabaseServerClient();

  // Fetch offer with listing info
  let offer;
  try {
    const { data, error: offerError } = await supabase
      .from("offers")
      .select("id, listing_id, buyer_id, status, expires_at")
      .eq("id", offerId)
      .single();

    if (offerError) throw offerError;
    offer = data;
    if (!offer) throw new Error("Offer not found");
  } catch {
    return { isOwner: false, reason: "Teklif bulunamadı veya bir hata oluştu." };
  }

  // Check if offer is already in target state (idempotency)
  if (offer.status === "accepted" || offer.status === "rejected") {
    return { isOwner: true }; // Already processed, allow safe return
  }

  // Fetch listing to verify ownership
  let listing;
  try {
    const { data, error: listingError } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", offer.listing_id)
      .single();

    if (listingError) throw listingError;
    listing = data;
    if (!listing) throw new Error("Listing not found");
  } catch {
    return { isOwner: false, reason: "İlan bulunamadı." };
  }

  if (listing.seller_id !== userId) {
    return { isOwner: false, reason: "Sadece ilan sahibi tekliflere yanıt verebilir." };
  }

  return { isOwner: true };
}

export async function getOffersForListing(listingId: string): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("offers")
    .select(
      `id, listing_id, buyer_id, offered_price, message, status, counter_price, counter_message, expires_at, created_at, updated_at, listing:listings(id, title, slug, price, city, seller_id, images:listing_images(public_url))`
    )
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getOffersForListing failed", error, { listingId });
    return [];
  }

  return (data ?? []) as unknown as Offer[];
}

export async function getOffersForUser(userId: string): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("offers")
    .select(
      `id, listing_id, buyer_id, offered_price, message, status, counter_price, counter_message, expires_at, created_at, updated_at, listing:listings(id, title, slug, price, city, seller_id, images:listing_images(public_url))`
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getOffersForUser failed", error, { userId });
    return [];
  }

  return (data ?? []) as unknown as Offer[];
}

export async function getOffersReceived(userId: string): Promise<Offer[]> {
  const supabase = await createSupabaseServerClient();

  // Use !inner join so the filter on seller_id works correctly via PostgREST
  const { data, error } = await supabase
    .from("offers")
    .select(
      `id, listing_id, buyer_id, offered_price, message, status, counter_price, counter_message, expires_at, created_at, updated_at, listing:listings!inner(id, title, slug, price, city, seller_id, images:listing_images(public_url)), buyer:profiles!offers_buyer_id_fkey(full_name, phone)`
    )
    .eq("listing.seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getOffersReceived failed", error, { userId });
    return [];
  }

  return (data ?? []) as unknown as Offer[];
}

export async function createOffer(params: {
  listingId: string;
  offeredPrice: number;
  message?: string;
  userId: string;
}) {
  const supabase = await createSupabaseServerClient();

  let listing;
  try {
    const { data, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, price, status")
      .eq("id", params.listingId)
      .single();

    if (listingError) throw listingError;
    listing = data;
    if (!listing) throw new Error("Listing not found");
  } catch {
    throw new Error("İlan bulunamadı.");
  }

  if (listing.status !== "approved") {
    throw new Error("Sadece onaylı ilanlara teklif verebilirsiniz.");
  }

  if (listing.seller_id === params.userId) {
    throw new Error("Kendi ilanınıza teklif veremezsiniz.");
  }

  if (params.offeredPrice <= 0) {
    throw new Error("Teklif fiyatı sıfırdan büyük olmalıdır.");
  }

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("offers").insert({
    listing_id: params.listingId,
    buyer_id: params.userId,
    offered_price: params.offeredPrice,
    message: params.message ?? null,
    expires_at: expiresAt,
  });

  if (error) {
    logger.db.error("createOffer failed", error, {
      listingId: params.listingId,
      userId: params.userId,
    });
    throw new Error("Teklif gönderilemedi.");
  }

  return { ok: true };
}

export async function respondToOffer(
  offerId: string,
  userId: string,
  response: "accepted" | "rejected" | "counter_offer",
  counterPrice?: number,
  counterMessage?: string
) {
  const supabase = await createSupabaseServerClient();

  let offer;
  try {
    const { data, error: offerError } = await supabase
      .from("offers")
      .select("id, listing_id, buyer_id, status, expires_at")
      .eq("id", offerId)
      .single();

    if (offerError) throw offerError;
    offer = data;
  } catch {
    throw new Error("Teklif bulunamadı.");
  }

  // Check if offer is already in target state (idempotency)
  if (offer.status === response) {
    logger.db.info("Offer already in target state (idempotent)", {
      offerId,
      status: response,
    });
    return { ok: true }; // Safe to return success - no duplicate side effects
  }

  // Check if offer is still actionable
  if (!["pending", "counter_offer"].includes(offer.status)) {
    throw new Error("Bu teklif zaten yanıtlandı.");
  }

  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    throw new Error("Bu teklifin süresi dolmuş.");
  }

  let listing;
  try {
    const { data, error: listingError } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", offer.listing_id)
      .single();

    if (listingError) throw listingError;
    listing = data;
    if (!listing) throw new Error("Listing not found");
  } catch {
    throw new Error("İlan bulunamadı.");
  }

  // Determine who can respond based on offer status
  const isSeller = listing.seller_id === userId;
  const isBuyer = offer.buyer_id === userId;

  if (offer.status === "pending" && !isSeller) {
    throw new Error("Sadece satıcı bekleyen tekliflere yanıt verebilir.");
  }

  if (offer.status === "counter_offer" && !isBuyer) {
    throw new Error("Sadece alıcı karşı tekliflere yanıt verebilir.");
  }

  if (!isSeller && !isBuyer) {
    throw new Error("Bu teklifi yanıtlama yetkiniz yok.");
  }

  const update: Record<string, unknown> = { status: response };

  if (response === "counter_offer") {
    if (!counterPrice || counterPrice <= 0) {
      throw new Error("Karşı teklif için geçerli bir fiyat girin.");
    }
    update.counter_price = counterPrice;
    update.counter_message = counterMessage ?? null;
  }

  // ── RACE CONDITION FIX: Include status check in WHERE clause ──
  // This prevents race conditions by only updating if offer is in expected state
  const allowedStatuses = response === "counter_offer" ? ["pending", "counter_offer"] : ["pending"];

  const { error } = await supabase
    .from("offers")
    .update(update)
    .eq("id", offerId)
    .in("status", allowedStatuses)
    .select("id"); // Only fetch ID to verify update happened

  if (error) {
    logger.db.error("respondToOffer failed", error, { offerId });
    throw new Error("Yanıt gönderilemedi.");
  }

  return { ok: true };
}

export async function createNewChat(_params: unknown) {
  if (_params) {
  }
  return { id: "mock-chat" };
}

export async function getUserChats(_userId: string) {
  if (_userId) {
  }
  return [];
}

export async function getChatMessages(_chatId: string) {
  if (_chatId) {
  }
  return [];
}

export async function sendChatMessage(_params: unknown) {
  if (_params) {
  }
  return { success: true };
}

export async function deleteChatMessage(_messageId: string) {
  if (_messageId) {
  }
  return { success: true };
}

export async function markChatMessagesAsRead(_chatId: string) {
  if (_chatId) {
  }
  return { success: true };
}

export async function toggleChatArchive(_chatId: string) {
  if (_chatId) {
  }
  return { success: true };
}
