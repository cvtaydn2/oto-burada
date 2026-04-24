import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface ExchangeOffer {
  id: string;
  listing_id: string;
  offerer_id: string;
  target_listing_id: string | null;
  target_car_desc: string;
  target_price: number | null;
  target_brand: string | null;
  target_model: string | null;
  target_year: number | null;
  target_mileage: number | null;
  notes: string | null;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getExchangeOffersForListing(listingId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("exchange_offers")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getExchangeOffersForListing failed", error, { listingId });
    return [];
  }

  return data as ExchangeOffer[];
}

export async function getPendingExchangesByOfferer(offererId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("exchange_offers")
    .select("*")
    .eq("offerer_id", offererId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("getPendingExchangesByOfferer failed", error, { offererId });
    return [];
  }

  return data as ExchangeOffer[];
}

export async function createExchangeOffer(params: {
  listingId: string;
  targetCarDesc: string;
  targetPrice?: number;
  targetBrand?: string;
  targetModel?: string;
  targetYear?: number;
  targetMileage?: number;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Giriş yapmalısınız.");

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id, is_exchange")
    .eq("id", params.listingId)
    .single();

  if (listingError || !listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (!listing.is_exchange) {
    throw new Error("Bu ilan takasa açık değil.");
  }

  if (listing.seller_id === user.id) {
    throw new Error("Kendi ilanınıza takas teklifi yapamazsınız.");
  }

  const { error } = await supabase.from("exchange_offers").insert({
    listing_id: params.listingId,
    offerer_id: user.id,
    target_car_desc: params.targetCarDesc,
    target_price: params.targetPrice ?? null,
    target_brand: params.targetBrand ?? null,
    target_model: params.targetModel ?? null,
    target_year: params.targetYear ?? null,
    target_mileage: params.targetMileage ?? null,
    notes: params.notes ?? null,
  });

  if (error) {
    logger.db.error("createExchangeOffer failed", error, {
      listingId: params.listingId,
      offererId: user.id,
    });
    throw new Error("Takas teklifi gönderilemedi.");
  }

  return { ok: true };
}

export async function respondToExchangeOffer(offerId: string, response: "accepted" | "rejected") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Giriş yapmalısınız.");

  const { data: offer, error: offerError } = await supabase
    .from("exchange_offers")
    .select("id, listing_id, status")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) {
    throw new Error("Teklif bulunamadı.");
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", offer.listing_id)
    .single();

  if (listingError || !listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (listing.seller_id !== user.id) {
    throw new Error("Bu teklifi yanıtlama yetkiniz yok.");
  }

  const { error } = await supabase
    .from("exchange_offers")
    .update({ status: response })
    .eq("id", offerId);

  if (error) {
    logger.db.error("respondToExchangeOffer failed", error, { offerId });
    throw new Error("Yanıt gönderilemedi.");
  }

  return { ok: true };
}
