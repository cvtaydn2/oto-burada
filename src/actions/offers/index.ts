"use server";

import { revalidatePath } from "next/cache";

import { createOffer, respondToOffer } from "@/features/offers/services/offer-service";
import { logger } from "@/features/shared/lib/logger";
import { createSupabaseServerClient } from "@/features/shared/lib/server";

export async function submitOfferAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Teklif için giriş yapmalısınız." };
  }

  const listingId = formData.get("listingId") as string;
  const offeredPrice = parseInt(formData.get("offeredPrice") as string, 10);
  const message = formData.get("message") as string | undefined;

  if (!listingId || isNaN(offeredPrice) || offeredPrice <= 0) {
    return { ok: false, error: "Geçerli bir teklif girin." };
  }

  try {
    await createOffer({
      listingId,
      offeredPrice,
      message,
      userId: user.id,
    });

    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/dashboard/teklifler");

    return { ok: true };
  } catch (err) {
    logger.db.error("submitOfferAction failed", err, { listingId, userId: user.id });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}

export async function acceptOfferAction(offerId: string): Promise<{ ok: boolean; error?: string }> {
  return respondToOfferAction(offerId, "accepted");
}

export async function rejectOfferAction(offerId: string): Promise<{ ok: boolean; error?: string }> {
  return respondToOfferAction(offerId, "rejected");
}

export async function counterOfferAction(
  offerId: string,
  counterPrice: number,
  counterMessage?: string
): Promise<{ ok: boolean; error?: string }> {
  return respondToOfferAction(offerId, "counter_offer", counterPrice, counterMessage);
}

async function respondToOfferAction(
  offerId: string,
  response: "accepted" | "rejected" | "counter_offer",
  counterPrice?: number,
  counterMessage?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Giriş yapmalısınız." };
  }

  try {
    await respondToOffer(offerId, user.id, response, counterPrice, counterMessage);
    revalidatePath("/dashboard/teklifler");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    logger.db.error("respondToOfferAction failed", err, { offerId, userId: user.id });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}
