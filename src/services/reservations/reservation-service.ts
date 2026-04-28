import { logger } from "@/lib/logging/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type CreateReservationInput,
  type Reservation,
  type ReservationWithListing,
  type ReservationWithParties,
} from "@/types";

const RESERVATION_TTL_HOURS = 48;

export async function getReservationsByBuyer(buyerId: string): Promise<Reservation[]> {
  // Temporary fallback: return empty array if table doesn't exist
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
      )
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false });

    if (error) {
      // Check if it's a table not found error
      if (error.code === "PGRST205" || error.message?.includes("reservations")) {
        logger.db.warn("Reservations table not found, returning empty array", { buyerId });
        return [];
      }
      logger.db.error("getReservationsByBuyer failed", { error, buyerId });
      throw new Error("Rezervasyonlar yüklenemedi.");
    }
    return data ?? [];
  } catch (err) {
    logger.db.warn("getReservationsByBuyer fallback", { error: err, buyerId });
    return [];
  }
}

export async function getReservationsBySeller(sellerId: string): Promise<ReservationWithListing[]> {
  // Temporary fallback: return empty array if table doesn't exist
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at,
        listing:listings!inner(
          id, slug, title, price,
          photos:listing_images(public_url)
        )
      `
      )
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      // Check if it's a table not found error
      if (error.code === "PGRST205" || error.message?.includes("reservations")) {
        logger.db.warn("Reservations table not found, returning empty array", { sellerId });
        return [];
      }
      logger.db.error("getReservationsBySeller failed", { error, sellerId });
      throw new Error("Rezervasyonlar yüklenemedi.");
    }
    return (data ?? []) as unknown as ReservationWithListing[];
  } catch (err) {
    logger.db.warn("getReservationsBySeller fallback", { error: err, sellerId });
    return [];
  }
}

export async function getActiveReservationForListing(
  listingId: string
): Promise<ReservationWithParties | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at,
        buyer:profiles!reservations_buyer_id_fkey(id, display_name, phone),
        seller:profiles!reservations_seller_id_fkey(id, display_name, phone)
      `
    )
    .eq("listing_id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    logger.db.error("getActiveReservationForListing failed", { error, listingId });
    throw new Error("Rezervasyon bilgisi yüklenemedi.");
  }
  return data as ReservationWithParties | null;
}

export async function createReservation(
  userId: string,
  input: CreateReservationInput
): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", input.listingId)
    .single();

  if (listingError || !listing) {
    throw new Error("İlan bulunamadı.");
  }

  if (listing.status !== "approved") {
    throw new Error("Sadece onaylı ilanlara kapora yatırılabilir.");
  }

  if (listing.seller_id === userId) {
    throw new Error("Kendi ilanınıza kapora yatıramazsınız.");
  }

  const expiresAt = new Date(Date.now() + RESERVATION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const platformFee = Number((input.amountDeposit * 0.025).toFixed(2));

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      listing_id: input.listingId,
      buyer_id: userId,
      seller_id: listing.seller_id,
      amount_deposit: input.amountDeposit,
      platform_fee: platformFee,
      expires_at: expiresAt,
      notes: input.notes ?? null,
    })
    .select(
      "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Bu ilana zaten kapora yatırmışsınız.");
    }
    logger.db.error("createReservation failed", { error, userId, listingId: input.listingId });
    throw new Error("Kapora rezervasyonu oluşturulamadı.");
  }

  return data;
}

export async function confirmReservation(
  userId: string,
  reservationId: string,
  appointmentAt?: string
): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "active",
      appointment_at: appointmentAt ?? null,
    })
    .eq("id", reservationId)
    .eq("seller_id", userId)
    .eq("status", "pending_payment")
    .select(
      "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error("Rezervasyon onaylanamadı.");
  }

  await supabase.from("reservation_events").insert({
    reservation_id: reservationId,
    actor_id: userId,
    event_type: "approved",
    payload: { appointment_at: appointmentAt },
  });

  return data;
}

export async function cancelReservation(
  userId: string,
  reservationId: string,
  reason?: string
): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("reservations")
    .select("id, buyer_id, seller_id, status, iyzico_payment_id")
    .eq("id", reservationId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Rezervasyon bulunamadı.");
  }

  const isBuyer = existing.buyer_id === userId;
  const isSeller = existing.seller_id === userId;
  const isParty = isBuyer || isSeller;

  if (!isParty) {
    throw new Error("Bu rezervasyonu iptal etme yetkiniz yok.");
  }

  const newStatus: "cancelled_by_buyer" | "cancelled_by_seller" = isBuyer
    ? "cancelled_by_buyer"
    : "cancelled_by_seller";

  const { data, error } = await supabase
    .from("reservations")
    .update({ status: newStatus })
    .eq("id", reservationId)
    .select(
      "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error("Rezervasyon iptal edilemedi.");
  }

  await supabase.from("reservation_events").insert({
    reservation_id: reservationId,
    actor_id: userId,
    event_type: "cancelled",
    payload: { reason: reason ?? null, cancelled_by: isBuyer ? "buyer" : "seller" },
  });

  return data;
}

export async function expireReservations(): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "expired" })
    .eq("status", "pending_payment")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    logger.db.error("expireReservations failed", { error });
    return 0;
  }

  const ids = data?.map((r) => r.id) ?? [];
  if (ids.length > 0) {
    logger.reservation.info(`Expired ${ids.length} reservations`);
  }

  return ids.length;
}
