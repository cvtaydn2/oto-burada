import {
  createExchangeOfferAction,
  getMyIncomingExchangeOffersAction,
  getMyIncomingExchangeOffersForListingAction,
  getMyOutgoingPendingExchangeOffersAction,
  respondToExchangeOfferAction,
} from "./exchange-offer-actions";

export type {
  CreateExchangeOfferInput,
  ExchangeActionError,
  ExchangeActionResult,
  ExchangeOfferRow as ExchangeOffer,
  ExchangeOfferListResult,
  ExchangeOfferMutationResult,
  ExchangeOfferResponse,
  ExchangeOfferStatus,
  IncomingExchangeOffer,
  OutgoingExchangeOffer,
  RespondToExchangeOfferInput,
} from "./exchange-offer.types";

export {
  createExchangeOfferAction,
  getMyIncomingExchangeOffersAction,
  getMyIncomingExchangeOffersForListingAction,
  getMyOutgoingPendingExchangeOffersAction,
  respondToExchangeOfferAction,
};

export async function createExchangeOffer(params: {
  listingId: string;
  targetListingId?: string | null;
  targetCarDesc: string;
  targetPrice?: number | null;
  targetBrand?: string | null;
  targetModel?: string | null;
  targetYear?: number | null;
  targetMileage?: number | null;
  notes?: string | null;
}) {
  const result = await createExchangeOfferAction(params);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return { ok: true };
}

export async function respondToExchangeOffer(offerId: string, response: "accepted" | "rejected") {
  const result = await respondToExchangeOfferAction({ offerId, response });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return { ok: true };
}

export async function getExchangeOffersForListing(listingId: string) {
  const result = await getMyIncomingExchangeOffersForListingAction(listingId);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data.offers;
}

export async function getPendingExchangesByOfferer(offererId: string) {
  const result = await getMyOutgoingPendingExchangeOffersAction(offererId);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data.offers;
}
