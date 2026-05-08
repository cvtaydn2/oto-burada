"use client";

import { Star } from "lucide-react";

interface Reviewer {
  full_name: string | null;
}

interface SellerReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Reviewer | null;
}

interface SellerReviewsListProps {
  reviews: SellerReview[];
}

export function SellerReviewsList({ reviews }: SellerReviewsListProps) {
  return (
    <>
      {reviews.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                    {review.reviewer?.full_name?.[0]?.toUpperCase() ?? "K"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {review.reviewer?.full_name ?? "Anonim"}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(review.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      className={
                        star <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-200"
                      }
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Bu satıcı hakkında henüz değerlendirme yapılmamış.
          </p>
        </div>
      )}
    </>
  );
}
