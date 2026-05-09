"use server";

import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

import { validateNotSelfReview, validateSellerReviewRating } from "./seller-reviews.logic";
import {
  getSellerReviewsRecord,
  getSellerReviewStatsRecord,
  insertSellerReviewRecord,
} from "./seller-reviews.records";

export async function getSellerReviews(
  sellerId: string,
  options?: { limit?: number; offset?: number }
) {
  return getSellerReviewsRecord(sellerId, options);
}

export async function getSellerReviewStats(sellerId: string) {
  return getSellerReviewStatsRecord(sellerId);
}

export async function createSellerReview(params: {
  sellerId: string;
  listingId?: string;
  rating: number;
  comment?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Giriş yapmalısınız.");

  validateNotSelfReview(user.id, params.sellerId);
  validateSellerReviewRating(params.rating);

  const { error } = await insertSellerReviewRecord({
    ...params,
    reviewerId: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Bu satıcıya zaten yorum yapmışsınız.");
    }
    logger.db.error("createSellerReview failed", error, {
      sellerId: params.sellerId,
      reviewerId: user.id,
    });
    throw new Error("Yorum gönderilemedi.");
  }

  return { ok: true };
}
