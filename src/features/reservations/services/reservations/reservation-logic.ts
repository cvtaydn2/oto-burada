export const RESERVATION_TTL_HOURS = 48;

export function calculatePlatformFee(amountDeposit: number): number {
  return Number((amountDeposit * 0.025).toFixed(2));
}

export function calculateExpiresAt(ttlHours: number = RESERVATION_TTL_HOURS): string {
  return new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
}

export function validateReservationCreation(params: {
  listing: { seller_id: string; status: string } | null;
  userId: string;
}) {
  if (!params.listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (params.listing.status !== "approved") {
    throw new Error("Sadece onaylı ilanlara kapora yatırılabilir.");
  }

  if (params.listing.seller_id === params.userId) {
    throw new Error("Kendi ilanınıza kapora yatıramazsınız.");
  }
}

export function determineCancellationStatus(params: {
  buyerId: string;
  userId: string;
}): "cancelled_by_buyer" | "cancelled_by_seller" {
  return params.buyerId === params.userId ? "cancelled_by_buyer" : "cancelled_by_seller";
}
