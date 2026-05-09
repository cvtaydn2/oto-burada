import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";
import {
  type Reservation,
  type ReservationWithListing,
  type ReservationWithParties,
} from "@/types";

export async function fetchReservationsByBuyer(buyerId: string): Promise<Reservation[]> {
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
      if (error.code === "PGRST205" || error.message?.includes("reservations")) {
        logger.db.warn("Reservations table not found, returning empty array", { buyerId });
        return [];
      }
      logger.db.error("fetchReservationsByBuyer failed", { error, buyerId });
      throw new Error("Rezervasyonlar yüklenemedi.");
    }
    return data ?? [];
  } catch (err) {
    logger.db.warn("fetchReservationsByBuyer fallback", { error: err, buyerId });
    return [];
  }
}

export async function fetchReservationsBySeller(
  sellerId: string
): Promise<ReservationWithListing[]> {
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
      if (error.code === "PGRST205" || error.message?.includes("reservations")) {
        logger.db.warn("Reservations table not found, returning empty array", { sellerId });
        return [];
      }
      logger.db.error("fetchReservationsBySeller failed", { error, sellerId });
      throw new Error("Rezervasyonlar yüklenemedi.");
    }
    return (data ?? []) as unknown as ReservationWithListing[];
  } catch (err) {
    logger.db.warn("fetchReservationsBySeller fallback", { error: err, sellerId });
    return [];
  }
}

export async function fetchActiveReservationForListing(
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
    logger.db.error("fetchActiveReservationForListing failed", { error, listingId });
    throw new Error("Rezervasyon bilgisi yüklenemedi.");
  }
  return data as ReservationWithParties | null;
}

export async function insertReservationRecord(params: {
  listingId: string;
  userId: string;
  sellerId: string;
  amountDeposit: number;
  platformFee: number;
  expiresAt: string;
  notes?: string;
}): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      listing_id: params.listingId,
      buyer_id: params.userId,
      seller_id: params.sellerId,
      amount_deposit: params.amountDeposit,
      platform_fee: params.platformFee,
      expires_at: params.expiresAt,
      notes: params.notes ?? null,
    })
    .select(
      "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Bu ilana zaten kapora yatırmışsınız.");
    }
    logger.db.error("insertReservationRecord failed", {
      error,
      userId: params.userId,
      listingId: params.listingId,
    });
    throw new Error("Kapora rezervasyonu oluşturulamadı.");
  }

  return data;
}

export async function updateReservationStatusToActive(params: {
  userId: string;
  reservationId: string;
  appointmentAt?: string;
}): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "active",
      appointment_at: params.appointmentAt ?? null,
    })
    .eq("id", params.reservationId)
    .eq("seller_id", params.userId)
    .eq("status", "pending_payment")
    .select(
      "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error("Rezervasyon onaylanamadı.");
  }

  await supabase.from("reservation_events").insert({
    reservation_id: params.reservationId,
    actor_id: params.userId,
    event_type: "approved",
    payload: { appointment_at: params.appointmentAt },
  });

  return data;
}

export async function updateReservationStatusToCancelled(params: {
  userId: string;
  reservationId: string;
  newStatus: "cancelled_by_buyer" | "cancelled_by_seller";
  reason?: string;
  isBuyer: boolean;
}): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .update({ status: params.newStatus })
    .eq("id", params.reservationId)
    .select(
      "id, listing_id, buyer_id, seller_id, amount_deposit, platform_fee, status, iyzico_payment_id, appointment_at, expires_at, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new Error("Rezervasyon iptal edilemedi.");
  }

  await supabase.from("reservation_events").insert({
    reservation_id: params.reservationId,
    actor_id: params.userId,
    event_type: "cancelled",
    payload: { reason: params.reason ?? null, cancelled_by: params.isBuyer ? "buyer" : "seller" },
  });

  return data;
}

export async function executeReservationExpiration(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "expired" })
    .eq("status", "pending_payment")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    logger.db.error("executeReservationExpiration failed", { error });
    return 0;
  }

  const ids = data?.map((r) => r.id) ?? [];
  if (ids.length > 0) {
    logger.reservation.info(`Expired ${ids.length} reservations`);
  }

  return ids.length;
}

export async function fetchListingById(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

export async function fetchReservationById(reservationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, buyer_id, seller_id, status, iyzico_payment_id")
    .eq("id", reservationId)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}
