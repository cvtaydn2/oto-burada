export type ExchangeOfferStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

export type ExchangeOfferResponse = "accepted" | "rejected";

export interface ExchangeOfferRow {
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
  status: ExchangeOfferStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeOfferListingSummary {
  id: string;
  title: string;
  slug: string;
}

export interface IncomingExchangeOffer extends ExchangeOfferRow {
  listing: ExchangeOfferListingSummary | null;
}

export interface OutgoingExchangeOffer extends ExchangeOfferRow {
  listing: ExchangeOfferListingSummary | null;
}

export interface ExchangeListingOwnershipRow {
  id: string;
  seller_id: string;
}

export interface CreateExchangeOfferInput {
  listingId: string;
  targetListingId?: string | null;
  targetCarDesc: string;
  targetPrice?: number | null;
  targetBrand?: string | null;
  targetModel?: string | null;
  targetYear?: number | null;
  targetMileage?: number | null;
  notes?: string | null;
}

export interface RespondToExchangeOfferInput {
  offerId: string;
  response: ExchangeOfferResponse;
}

export type ExchangeActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SELF_OFFER"
  | "ALREADY_RESPONDED"
  | "EXPIRED"
  | "OPERATION_FAILED"
  | "DB_ERROR";

export interface ExchangeActionError {
  code: ExchangeActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type ExchangeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ExchangeActionError };

export interface ExchangeOfferMutationResult {
  offerId: string;
  status: ExchangeOfferStatus;
  expiresAt: string | null;
}

export interface ExchangeOfferListResult {
  offers: IncomingExchangeOffer[] | OutgoingExchangeOffer[];
}
