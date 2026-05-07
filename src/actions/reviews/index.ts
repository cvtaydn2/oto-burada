"use server";

import { revalidatePath } from "next/cache";

import { createSellerReview } from "@/features/profile/services/seller-reviews";
import { logger } from "@/features/shared/lib/logger";
import { createSupabaseServerClient } from "@/features/shared/lib/server";

export async function submitReviewAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Yorum yazmak için giriş yapmalısınız." };
  }

  const sellerId = formData.get("sellerId") as string;
  const listingId = formData.get("listingId") as string | null;
  const rating = parseInt(formData.get("rating") as string, 10);
  const comment = formData.get("comment") as string | undefined;

  if (!sellerId || isNaN(rating)) {
    return { ok: false, error: "Eksik bilgi." };
  }

  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Puan 1-5 arası olmalı." };
  }

  try {
    await createSellerReview({
      sellerId,
      listingId: listingId ?? undefined,
      rating,
      comment,
    });

    revalidatePath(`/seller/${sellerId}`);
    revalidatePath(`/listing/`);

    return { ok: true };
  } catch (err) {
    logger.db.error("submitReviewAction failed", err, { sellerId, userId: user.id });
    const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
    return { ok: false, error: msg };
  }
}
