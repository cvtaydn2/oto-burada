"use server";

import { revalidatePath } from "next/cache";

import { createReservation as createReservationSvc } from "@/features/reservations/services/reservation-service";
import { logger } from "@/features/shared/lib/logger";
import { createSupabaseServerClient } from "@/features/shared/lib/server";
import type { CreateReservationInput } from "@/types";

export async function createReservationAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Giriş yapmalısınız." };
  }

  const listingId = formData.get("listingId") as string;
  const amountDeposit = parseFloat(formData.get("amountDeposit") as string);
  const notes = formData.get("notes") as string | undefined;

  if (!listingId) {
    return { ok: false, error: "İlan seçilmedi." };
  }
  if (isNaN(amountDeposit) || amountDeposit <= 0) {
    return { ok: false, error: "Geçerli bir kapora tutarı girin." };
  }

  try {
    const input: CreateReservationInput = { listingId, amountDeposit, notes };
    await createReservationSvc(user.id, input);

    revalidatePath("/dashboard/listings");
    revalidatePath("/dashboard/reservations");

    return { ok: true };
  } catch (err) {
    logger.reservation.error("createReservationAction failed", err, {
      userId: user.id,
      listingId,
    });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}

export async function confirmReservationAction(
  reservationId: string,
  appointmentAt?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Giriş yapmalısınız." };
  }

  try {
    const { confirmReservation } =
      await import("@/features/reservations/services/reservation-service");
    await confirmReservation(user.id, reservationId, appointmentAt);

    revalidatePath("/dashboard/reservations");
    revalidatePath(`/dashboard/listings`);

    return { ok: true };
  } catch (err) {
    logger.reservation.error("confirmReservationAction failed", err, {
      userId: user.id,
      reservationId,
    });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}

export async function cancelReservationAction(
  reservationId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Giriş yapmalısınız." };
  }

  try {
    const { cancelReservation } =
      await import("@/features/reservations/services/reservation-service");
    await cancelReservation(user.id, reservationId, reason);

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/listings");

    return { ok: true };
  } catch (err) {
    logger.reservation.error("cancelReservationAction failed", err, {
      userId: user.id,
      reservationId,
    });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}
