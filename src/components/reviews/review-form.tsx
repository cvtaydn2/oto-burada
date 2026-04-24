"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { submitReviewAction } from "@/actions/reviews";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SellerReview } from "@/services/profile/seller-reviews";

interface ReviewFormProps {
  sellerId: string;
  listingId?: string;
  children?: React.ReactNode;
}

export function ReviewForm({ sellerId, listingId, children }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Puan seçiniz.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("sellerId", sellerId);
    if (listingId) formData.set("listingId", listingId);
    formData.set("rating", rating.toString());
    formData.set("comment", comment);

    const result = await submitReviewAction(null, formData);
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Yorum gönderilemedi.");
      return;
    }

    toast.success("Yorumunuz gönderildi.");
    setOpen(false);
    setRating(0);
    setComment("");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="sellerId" value={sellerId} />
          {listingId && <input type="hidden" name="listingId" value={listingId} />}

          <SheetHeader className="gap-4 p-6 pb-2">
            <SheetTitle className="text-xl">Yorum Yap</SheetTitle>
            <SheetDescription>Bu satıcıya olan deneyiminizi paylaşın.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-6 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Puanınız</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={cn(
                        "transition-colors",
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-200"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {rating === 0
                  ? "Puan seçiniz"
                  : rating === 1
                    ? "Çok kötü"
                    : rating === 2
                      ? "Kötü"
                      : rating === 3
                        ? "Orta"
                        : rating === 4
                          ? "İyi"
                          : "Çok iyi"}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Yorum (opsiyonel)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Deneyiminizi paylaşın..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">{comment.length}/500</p>
            </div>
          </div>

          <SheetFooter className="p-6 pt-2">
            <button
              type="submit"
              disabled={isLoading || rating === 0}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? "Gönderiliyor..." : "Yorum Gönder"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

interface ReviewListProps {
  reviews: SellerReview[];
  limit?: number;
}

export function ReviewList({ reviews, limit = 3 }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Henüz yorum yok.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, limit).map((review) => (
        <div key={review.id} className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-sm">{review.reviewer?.full_name || "Anonim"}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={cn(
                    star <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-100 text-slate-200"
                  )}
                />
              ))}
            </div>
          </div>
          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          <p className="mt-2 text-xs text-muted-foreground/60">
            {new Date(review.created_at).toLocaleDateString("tr-TR")}
          </p>
        </div>
      ))}
    </div>
  );
}
