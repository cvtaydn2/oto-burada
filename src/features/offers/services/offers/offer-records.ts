import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import { type Offer } from "./offer-logic";

export async function getOfferById(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("offers")
    .select("id, listing_id, buyer_id, status, expires_at")
    .eq("id", offerId)
    .single();

  if (error) {
    logger.db.error("getOfferById failed", error, { offerId });
    return null;
  }
  return data;
}

export async function getListingForOfferCheck(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, seller_id, price, status")
    .eq("id", listingId)
    .single();

  if (error) {
    logger.db.error("getListingForOfferCheck failed", error, { listingId });
    return null;
  }
  return data;
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

export async function insertOfferRecord(params: {
  listingId: string;
  userId: string;
  offeredPrice: number;
  message?: string;
  expiresAt: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("offers").insert({
    listing_id: params.listingId,
    buyer_id: params.userId,
    offered_price: params.offeredPrice,
    message: params.message ?? null,
    expires_at: params.expiresAt,
  });

  if (error) {
    logger.db.error("insertOfferRecord failed", error, params);
    throw new Error("Teklif gönderilemedi.");
  }

  return { ok: true };
}

export async function updateOfferStatusRecord(
  offerId: string,
  update: Record<string, unknown>,
  allowedStatuses: string[]
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("offers")
    .update(update)
    .eq("id", offerId)
    .in("status", allowedStatuses)
    .select("id");

  if (error) {
    logger.db.error("updateOfferStatusRecord failed", error, { offerId });
    throw new Error("Yanıt gönderilemedi.");
  }

  return { ok: true };
}
