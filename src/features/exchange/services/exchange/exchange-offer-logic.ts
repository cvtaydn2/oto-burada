import type {
  ExchangeOfferResponse,
  ExchangeOfferRow,
  ExchangeOfferStatus,
} from "./exchange-offer.types";

export const DEFAULT_EXCHANGE_OFFER_EXPIRY_HOURS = 72;

export class ExchangeOfferRuleError extends Error {
  code: "SELF_OFFER" | "ALREADY_RESPONDED" | "EXPIRED" | "INVALID_TRANSITION" | "OPERATION_FAILED";

  constructor(
    code:
      | "SELF_OFFER"
      | "ALREADY_RESPONDED"
      | "EXPIRED"
      | "INVALID_TRANSITION"
      | "OPERATION_FAILED",
    message: string
  ) {
    super(message);
    this.name = "ExchangeOfferRuleError";
    this.code = code;
  }
}

export function buildOfferExpiryDate(
  now = new Date(),
  hours = DEFAULT_EXCHANGE_OFFER_EXPIRY_HOURS
): string {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isOfferExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function assertCanCreateExchangeOffer(params: {
  listingSellerId: string;
  currentUserId: string;
}) {
  if (params.listingSellerId === params.currentUserId) {
    throw new ExchangeOfferRuleError("SELF_OFFER", "Kendi ilanınıza takas teklifi yapamazsınız.");
  }
}

export function isRespondableStatus(status: ExchangeOfferStatus): boolean {
  return status === "pending";
}

export function assertValidExchangeTransition(
  currentStatus: ExchangeOfferStatus,
  response: ExchangeOfferResponse
) {
  if (!isRespondableStatus(currentStatus)) {
    throw new ExchangeOfferRuleError("ALREADY_RESPONDED", "Bu teklif zaten yanıtlandı.");
  }

  if (response !== "accepted" && response !== "rejected") {
    throw new ExchangeOfferRuleError("INVALID_TRANSITION", "Geçersiz teklif yanıtı.");
  }
}

export function assertCanRespondToOffer(
  offer: Pick<ExchangeOfferRow, "status" | "expires_at">,
  response: ExchangeOfferResponse,
  now = new Date()
) {
  assertValidExchangeTransition(offer.status, response);

  if (isOfferExpired(offer.expires_at, now)) {
    throw new ExchangeOfferRuleError("EXPIRED", "Bu teklifin süresi dolmuş.");
  }
}

export function resolveFailedResponseMutationMessage(
  offer: Pick<ExchangeOfferRow, "status" | "expires_at"> | null,
  now = new Date()
): never {
  if (!offer) {
    throw new ExchangeOfferRuleError("OPERATION_FAILED", "Teklif işlenemedi.");
  }

  if (offer.status !== "pending") {
    throw new ExchangeOfferRuleError("ALREADY_RESPONDED", "Bu teklif zaten yanıtlandı.");
  }

  if (isOfferExpired(offer.expires_at, now)) {
    throw new ExchangeOfferRuleError("EXPIRED", "Bu teklifin süresi dolmuş.");
  }

  throw new ExchangeOfferRuleError(
    "OPERATION_FAILED",
    "Teklif şu anda işlenemiyor. Lütfen tekrar deneyin."
  );
}
