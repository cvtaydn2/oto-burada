import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

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
    images: string[];
  };
}

export async function getOffersForListing(listingId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("offers")
    .select(`*, listing:listings(id, title, slug, price, city)`)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getOffersForListing failed", error, { listingId });
    return [];
  }

  return data as Offer[];
}

export async function getOffersForUser(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("offers")
    .select(`*, listing:listings(id, title, slug, price, city)`)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getOffersForUser failed", error, { userId });
    return [];
  }

  return data as Offer[];
}

export async function getOffersReceived(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Use !inner join so the filter on seller_id works correctly via PostgREST
  const { data, error } = await supabase
    .from("offers")
    .select(
      `*, listing:listings!inner(id, title, slug, price, city, seller_id), buyer:profiles!offers_buyer_id_fkey(full_name, phone)`
    )
    .eq("listing.seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getOffersReceived failed", error, { userId });
    return [];
  }

  return data as Offer[];
}

export async function createOffer(params: {
  listingId: string;
  offeredPrice: number;
  message?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Giriş yapmalısınız.");

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id, price, status")
    .eq("id", params.listingId)
    .single();

  if (listingError || !listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (listing.status !== "approved") {
    throw new Error("Sadece onaylı ilanlara teklif verebilirsiniz.");
  }

  if (listing.seller_id === user.id) {
    throw new Error("Kendi ilanınıza teklif veremezsiniz.");
  }

  if (params.offeredPrice <= 0) {
    throw new Error("Teklif fiyatı sıfırdan büyük olmalıdır.");
  }

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("offers").insert({
    listing_id: params.listingId,
    buyer_id: user.id,
    offered_price: params.offeredPrice,
    message: params.message ?? null,
    expires_at: expiresAt,
  });

  if (error) {
    logger.db.error("createOffer failed", error, {
      listingId: params.listingId,
      userId: user.id,
    });
    throw new Error("Teklif gönderilemedi.");
  }

  return { ok: true };
}

export async function respondToOffer(
  offerId: string,
  response: "accepted" | "rejected" | "counter_offer",
  counterPrice?: number,
  counterMessage?: string
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Giriş yapmalısınız.");

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, listing_id, buyer_id, status, expires_at")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) {
    throw new Error("Teklif bulunamadı.");
  }

  // Check if offer is still actionable
  if (!["pending", "counter_offer"].includes(offer.status)) {
    throw new Error("Bu teklif zaten yanıtlandı.");
  }

  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    throw new Error("Bu teklifin süresi dolmuş.");
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", offer.listing_id)
    .single();

  if (listingError || !listing) {
    throw new Error("İlan bulunamadı.");
  }

  // Determine who can respond based on offer status
  const isSeller = listing.seller_id === user.id;
  const isBuyer = offer.buyer_id === user.id;

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

  const { error } = await supabase.from("offers").update(update).eq("id", offerId);

  if (error) {
    logger.db.error("respondToOffer failed", error, { offerId });
    throw new Error("Yanıt gönderilemedi.");
  }

  return { ok: true };
}
