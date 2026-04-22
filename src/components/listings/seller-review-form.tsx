"use client";

import { CheckCircle2, Loader2, Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface SellerReviewFormProps {
  sellerId: string;
  listingId: string;
  sellerName: string;
  /** If provided, the form is shown inline. Otherwise it's hidden behind a toggle. */
  defaultOpen?: boolean;
}

export function SellerReviewForm({
  sellerId,
  listingId,
  sellerName,
  defaultOpen = false,
}: SellerReviewFormProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Lütfen bir puan seç.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/seller-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          listingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error?.message ?? "Bir hata oluştu. Lütfen tekrar dene.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Bağlantı hatası. Lütfen tekrar dene.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
        Değerlendirmeniz kaydedildi. Teşekkürler!
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
      >
        <Star size={15} className="text-amber-400" />
        Satıcıyı Değerlendir
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground mb-1">{sellerName} için değerlendirme</p>
        <p className="text-xs text-muted-foreground">
          Deneyimini paylaş, diğer alıcılara yardımcı ol.
        </p>
      </div>

      {/* Star Rating */}
      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Puan
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform  focus:outline-none"
              aria-label={`${star} yıldız`}
            >
              <Star
                size={28}
                className={cn(
                  "transition-colors",
                  star <= (hovered || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-100 text-slate-200"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs font-bold text-muted-foreground">
              {["", "Çok kötü", "Kötü", "Orta", "İyi", "Mükemmel"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="review-comment"
          className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          Yorum <span className="font-normal text-muted-foreground/70">(isteğe bağlı)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Satıcıyla iletişim, güvenilirlik, araç durumu hakkında ne düşünüyorsun?"
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-blue-400 focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground/70">{comment.length}/500</p>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading" || rating === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" && <Loader2 size={14} className="animate-spin" />}
          Gönder
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground/90 transition"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
