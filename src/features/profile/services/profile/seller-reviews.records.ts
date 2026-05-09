import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/server";

export interface SellerReview {
  id: string;
  seller_id: string;
  reviewer_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  is_visible: boolean;
  created_at: string;
  reviewer?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export async function getSellerReviewsRecord(
  sellerId: string,
  options?: { limit?: number; offset?: number }
) {
  const supabase = await createSupabaseServerClient();
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const { data, error } = await supabase
    .from("seller_reviews")
    .select(
      ` *,
      reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url)`
    )
    .eq("seller_id", sellerId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.db.error("getSellerReviews query failed", error, { sellerId });
    return [];
  }

  return data as SellerReview[];
}

export async function getSellerReviewStatsRecord(sellerId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("review_count, review_avg")
    .eq("id", sellerId)
    .single();

  if (error || !profile) {
    return { average: 0, count: 0 };
  }

  return {
    average: profile.review_avg ?? 0,
    count: profile.review_count ?? 0,
  };
}

export async function insertSellerReviewRecord(params: {
  sellerId: string;
  reviewerId: string;
  listingId?: string;
  rating: number;
  comment?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("seller_reviews").insert({
    seller_id: params.sellerId,
    reviewer_id: params.reviewerId,
    listing_id: params.listingId ?? null,
    rating: params.rating,
    comment: params.comment ?? null,
  });

  return { error };
}
