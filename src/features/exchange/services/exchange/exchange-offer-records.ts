import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import type {
  ExchangeListingOwnershipRow,
  ExchangeOfferListingSummary,
  ExchangeOfferResponse,
  ExchangeOfferRow,
  IncomingExchangeOffer,
  OutgoingExchangeOffer,
} from "./exchange-offer.types";

type ExchangeSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const EXCHANGE_OFFER_COLUMNS = `
  id,
  listing_id,
  offerer_id,
  target_listing_id,
  target_car_desc,
  target_price,
  target_brand,
  target_model,
  target_year,
  target_mileage,
  notes,
  status,
  expires_at,
  created_at,
  updated_at
`;

const EXCHANGE_OFFER_WITH_LISTING_COLUMNS = `
  ${EXCHANGE_OFFER_COLUMNS},
  listing:listings!inner(
    id,
    title,
    slug
  )
`;

interface RawOfferWithListing extends Omit<ExchangeOfferRow, "listing"> {
  listing: ExchangeOfferListingSummary | ExchangeOfferListingSummary[] | null;
}

function mapOfferWithListing(row: unknown): IncomingExchangeOffer {
  const data = row as RawOfferWithListing;
  const rawListing = data.listing;
  const listing = Array.isArray(rawListing) ? rawListing[0] : rawListing;

  return {
    ...(data as unknown as ExchangeOfferRow),
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          slug: listing.slug,
        }
      : null,
  } as IncomingExchangeOffer;
}

export async function findListingOwnershipById(
  supabase: ExchangeSupabaseClient,
  listingId: string
): Promise<ExchangeListingOwnershipRow | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    logger.db.error("findListingOwnershipById failed", error, { listingId });
    throw error;
  }

  return data;
}

export async function findOfferById(
  supabase: ExchangeSupabaseClient,
  offerId: string
): Promise<ExchangeOfferRow | null> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_COLUMNS)
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    logger.db.error("findOfferById failed", error, { offerId });
    throw error;
  }

  return data;
}

export async function findOfferStatusById(
  supabase: ExchangeSupabaseClient,
  offerId: string
): Promise<Pick<ExchangeOfferRow, "status" | "expires_at"> | null> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select("status, expires_at")
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    logger.db.error("findOfferStatusById failed", error, { offerId });
    throw error;
  }

  return data;
}

export async function listIncomingExchangeOffersForSeller(
  supabase: ExchangeSupabaseClient,
  sellerId: string
): Promise<IncomingExchangeOffer[]> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_WITH_LISTING_COLUMNS)
    .eq("listing.seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("listIncomingExchangeOffersForSeller failed", error, { sellerId });
    throw error;
  }

  return (data ?? []).map((row: unknown) => mapOfferWithListing(row));
}

export async function listIncomingExchangeOffersForListingAndSeller(
  supabase: ExchangeSupabaseClient,
  params: { listingId: string; sellerId: string }
): Promise<IncomingExchangeOffer[]> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_WITH_LISTING_COLUMNS)
    .eq("listing_id", params.listingId)
    .eq("listing.seller_id", params.sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("listIncomingExchangeOffersForListingAndSeller failed", error, params);
    throw error;
  }

  return (data ?? []).map((row: unknown) => mapOfferWithListing(row));
}

export async function listOutgoingPendingExchangeOffersForOfferer(
  supabase: ExchangeSupabaseClient,
  offererId: string
): Promise<OutgoingExchangeOffer[]> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .select(EXCHANGE_OFFER_WITH_LISTING_COLUMNS)
    .eq("offerer_id", offererId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    logger.db.error("listOutgoingPendingExchangeOffersForOfferer failed", error, {
      offererId,
    });
    throw error;
  }

  return (data ?? []).map((row: unknown) => mapOfferWithListing(row) as OutgoingExchangeOffer);
}

export async function insertExchangeOffer(
  supabase: ExchangeSupabaseClient,
  payload: {
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
    expires_at: string;
  }
): Promise<Pick<ExchangeOfferRow, "id" | "status" | "expires_at">> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .insert(payload)
    .select("id, status, expires_at")
    .single();

  if (error) {
    logger.db.error("insertExchangeOffer failed", error, {
      listingId: payload.listing_id,
      offererId: payload.offerer_id,
    });
    throw error;
  }

  return data;
}

export async function updateOfferStatusIfPendingAndUnexpired(
  supabase: ExchangeSupabaseClient,
  params: {
    offerId: string;
    response: ExchangeOfferResponse;
    nowIso: string;
  }
): Promise<Pick<ExchangeOfferRow, "id" | "status" | "expires_at"> | null> {
  const { data, error } = await supabase
    .from("exchange_offers")
    .update({
      status: params.response,
    })
    .eq("id", params.offerId)
    .eq("status", "pending")
    .or(`expires_at.is.null,expires_at.gt.${params.nowIso}`)
    .select("id, status, expires_at")
    .maybeSingle();

  if (error) {
    logger.db.error("updateOfferStatusIfPendingAndUnexpired failed", error, params);
    throw error;
  }

  return data;
}
