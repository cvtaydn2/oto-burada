"use server";

import { logger } from "@/lib/logger";

import { isUserOfferOwner, validateOfferCreation, validateOfferResponse } from "./offer-logic";
import {
  getListingForOfferCheck,
  getOfferById,
  getOffersForListing,
  getOffersForUser,
  getOffersReceived,
  insertOfferRecord,
  updateOfferStatusRecord,
} from "./offer-records";

export async function verifyOfferOwnership(
  offerId: string,
  userId: string
): Promise<{ isOwner: boolean; reason?: string }> {
  const offer = await getOfferById(offerId);
  if (!offer) {
    return { isOwner: false, reason: "Teklif bulunamadı veya bir hata oluştu." };
  }

  // Check if offer is already in target state (idempotency)
  if (offer.status === "accepted" || offer.status === "rejected") {
    return { isOwner: true }; // Already processed, allow safe return
  }

  const listing = await getListingForOfferCheck(offer.listing_id);
  if (!listing) {
    return { isOwner: false, reason: "İlan bulunamadı." };
  }

  if (!isUserOfferOwner(listing.seller_id, userId)) {
    return { isOwner: false, reason: "Sadece ilan sahibi tekliflere yanıt verebilir." };
  }

  return { isOwner: true };
}

export { getOffersForListing, getOffersForUser, getOffersReceived };

export async function createOffer(params: {
  listingId: string;
  offeredPrice: number;
  message?: string;
  userId: string;
}) {
  const listing = await getListingForOfferCheck(params.listingId);

  validateOfferCreation({
    listing,
    userId: params.userId,
    offeredPrice: params.offeredPrice,
  });

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  return insertOfferRecord({
    listingId: params.listingId,
    userId: params.userId,
    offeredPrice: params.offeredPrice,
    message: params.message,
    expiresAt,
  });
}

export async function respondToOffer(
  offerId: string,
  userId: string,
  response: "accepted" | "rejected" | "counter_offer",
  counterPrice?: number,
  counterMessage?: string
) {
  const offer = await getOfferById(offerId);
  if (!offer) {
    throw new Error("Teklif bulunamadı.");
  }

  // Check if offer is already in target state (idempotency)
  if (offer.status === response) {
    logger.db.info("Offer already in target state (idempotent)", {
      offerId,
      status: response,
    });
    return { ok: true };
  }

  const listing = await getListingForOfferCheck(offer.listing_id);
  if (!listing) {
    throw new Error("İlan bulunamadı.");
  }

  validateOfferResponse({
    offer,
    listingSellerId: listing.seller_id,
    userId,
    response,
    counterPrice,
  });

  const update: Record<string, unknown> = { status: response };

  if (response === "counter_offer") {
    update.counter_price = counterPrice;
    update.counter_message = counterMessage ?? null;
  }

  const allowedStatuses = response === "counter_offer" ? ["pending", "counter_offer"] : ["pending"];

  return updateOfferStatusRecord(offerId, update, allowedStatuses);
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// ─── MOCK CHAT METHODS (Backwards Compatibility) ─────────────────────────────────

export async function createNewChat(_params: unknown) {
  return { id: "mock-chat" };
}

export async function getUserChats(_userId: string) {
  return [];
}

export async function getChatMessages(_chatId: string) {
  return [];
}

export async function sendChatMessage(_params: unknown) {
  return { success: true };
}

export async function deleteChatMessage(_messageId: string) {
  return { success: true };
}

export async function markChatMessagesAsRead(_chatId: string) {
  return { success: true };
}

export async function toggleChatArchive(_chatId: string) {
  return { success: true };
}
export type { Offer } from "./offer-logic";
