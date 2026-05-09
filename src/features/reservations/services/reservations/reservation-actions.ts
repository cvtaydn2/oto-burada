"use server";

import {
  type CreateReservationInput,
  type Reservation,
  type ReservationWithListing,
  type ReservationWithParties,
} from "@/types";

import {
  calculateExpiresAt,
  calculatePlatformFee,
  determineCancellationStatus,
  validateReservationCreation,
} from "./reservation-logic";
import {
  executeReservationExpiration,
  fetchActiveReservationForListing,
  fetchListingById,
  fetchReservationById,
  fetchReservationsByBuyer,
  fetchReservationsBySeller,
  insertReservationRecord,
  updateReservationStatusToActive,
  updateReservationStatusToCancelled,
} from "./reservation-records";

export async function getReservationsByBuyer(buyerId: string): Promise<Reservation[]> {
  return fetchReservationsByBuyer(buyerId);
}

export async function getReservationsBySeller(sellerId: string): Promise<ReservationWithListing[]> {
  return fetchReservationsBySeller(sellerId);
}

export async function getActiveReservationForListing(
  listingId: string
): Promise<ReservationWithParties | null> {
  return fetchActiveReservationForListing(listingId);
}

export async function createReservation(
  userId: string,
  input: CreateReservationInput
): Promise<Reservation> {
  const listing = await fetchListingById(input.listingId);

  validateReservationCreation({
    listing,
    userId,
  });

  // Since listing was validated as not null above:
  const sellerId = listing!.seller_id;
  const expiresAt = calculateExpiresAt();
  const platformFee = calculatePlatformFee(input.amountDeposit);

  return insertReservationRecord({
    listingId: input.listingId,
    userId,
    sellerId,
    amountDeposit: input.amountDeposit,
    platformFee,
    expiresAt,
    notes: input.notes,
  });
}

export async function confirmReservation(
  userId: string,
  reservationId: string,
  appointmentAt?: string
): Promise<Reservation> {
  return updateReservationStatusToActive({
    userId,
    reservationId,
    appointmentAt,
  });
}

export async function cancelReservation(
  userId: string,
  reservationId: string,
  reason?: string
): Promise<Reservation> {
  const existing = await fetchReservationById(reservationId);

  if (!existing) {
    throw new Error("Rezervasyon bulunamadı.");
  }

  const isBuyer = existing.buyer_id === userId;
  const isSeller = existing.seller_id === userId;
  const isParty = isBuyer || isSeller;

  if (!isParty) {
    throw new Error("Bu rezervasyonu iptal etme yetkiniz yok.");
  }

  const newStatus = determineCancellationStatus({
    buyerId: existing.buyer_id,
    userId,
  });

  return updateReservationStatusToCancelled({
    userId,
    reservationId,
    newStatus,
    reason,
    isBuyer,
  });
}

export async function expireReservations(): Promise<number> {
  return executeReservationExpiration();
}
