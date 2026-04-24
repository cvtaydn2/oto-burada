"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { createExchangeOffer, respondToExchangeOffer } from "@/services/exchange/exchange-offers";

export async function submitExchangeOfferAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Takas teklifi için giriş yapmalısınız." };
  }

  const listingId = formData.get("listingId") as string;
  const targetCarDesc = formData.get("targetCarDesc") as string;
  const targetPrice = formData.get("targetPrice")
    ? parseInt(formData.get("targetPrice") as string, 10)
    : undefined;
  const targetBrand = formData.get("targetBrand") as string | undefined;
  const targetModel = formData.get("targetModel") as string | undefined;
  const targetYear = formData.get("targetYear")
    ? parseInt(formData.get("targetYear") as string, 10)
    : undefined;
  const targetMileage = formData.get("targetMileage")
    ? parseInt(formData.get("targetMileage") as string, 10)
    : undefined;
  const notes = formData.get("notes") as string | undefined;

  if (!listingId || !targetCarDesc) {
    return { ok: false, error: "Eksik bilgi." };
  }

  try {
    await createExchangeOffer({
      listingId,
      targetCarDesc,
      targetPrice,
      targetBrand,
      targetModel,
      targetYear,
      targetMileage,
      notes,
    });

    revalidatePath(`/listing/`);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    logger.db.error("submitExchangeOfferAction failed", err, { listingId, userId: user.id });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}

export async function acceptExchangeOfferAction(
  offerId: string
): Promise<{ ok: boolean; error?: string }> {
  return respondToExchangeAction(offerId, "accepted");
}

export async function rejectExchangeOfferAction(
  offerId: string
): Promise<{ ok: boolean; error?: string }> {
  return respondToExchangeAction(offerId, "rejected");
}

async function respondToExchangeAction(
  offerId: string,
  response: "accepted" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Giriş yapmalısınız." };
  }

  try {
    await respondToExchangeOffer(offerId, response);
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (err) {
    logger.db.error("respondToExchangeAction failed", err, { offerId, userId: user.id });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}
