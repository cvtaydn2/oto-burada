/**
 * POST /api/seller-reviews
 * Submit a review for a seller.
 *
 * Rules:
 * - Must be authenticated
 * - Cannot review yourself
 * - One review per reviewer per seller (upsert on conflict)
 * - Rating must be 1-5
 */

import { z } from "zod";

import { rateLimitProfiles } from "@/lib/rate-limit";
import { API_ERROR_CODES, apiError, apiSuccess } from "@/lib/response";
import { sanitizeText } from "@/lib/sanitize";
import { withAuthAndCsrf } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/server";

const reviewSchema = z.object({
  sellerId: z.string().uuid("Geçersiz satıcı ID."),
  listingId: z.string().uuid("Geçersiz ilan ID.").optional(),
  rating: z.number().int().min(1, "Puan en az 1 olmalı.").max(5, "Puan en fazla 5 olabilir."),
  comment: z.string().trim().max(500, "Yorum en fazla 500 karakter olabilir.").optional(),
});

// 5 reviews per hour per user
const REVIEW_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const security = await withAuthAndCsrf(request, {
    ipRateLimit: rateLimitProfiles.general,
    userRateLimit: REVIEW_RATE_LIMIT,
    rateLimitKey: "seller-reviews:create",
  });

  if (!security.ok) return security.response;
  const user = security.user!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.BAD_REQUEST, "İstek gövdesi okunamadı.", 400);
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      parsed.error.issues[0]?.message ?? "Geçersiz değerlendirme verisi.",
      400
    );
  }

  const { sellerId, listingId, rating, comment } = parsed.data;

  // Cannot review yourself
  if (sellerId === user.id) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Kendi profilini değerlendiremezsin.", 403);
  }

  const sanitizedComment = comment ? sanitizeText(comment) : null;

  const supabase = await createSupabaseServerClient();

  // Upsert — one review per reviewer per seller
  const { data, error } = await supabase
    .from("seller_reviews")
    .upsert(
      {
        seller_id: sellerId,
        reviewer_id: user.id,
        listing_id: listingId ?? null,
        rating,
        comment: sanitizedComment,
      },
      { onConflict: "reviewer_id,listing_id" }
    )
    .select("id, rating, comment, created_at")
    .single();

  if (error) {
    const { captureServerError } = await import("@/lib/telemetry-server");
    captureServerError(
      "Seller review upsert failed",
      "reviews",
      error,
      { sellerId, reviewerId: user.id },
      user.id
    );
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Değerlendirme kaydedilemedi. Lütfen tekrar dene.",
      500
    );
  }

  return apiSuccess({ review: data }, "Değerlendirmeniz kaydedildi.", 201);
}
