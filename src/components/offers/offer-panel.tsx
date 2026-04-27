"use client";

import { DollarSign, Tag, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { submitOfferAction } from "@/actions/offers";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/utils";

interface OfferPanelProps {
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  currentPrice: number;
  currentUserId?: string | null;
  sellerId: string;
  /** If true, renders a compact trigger button suitable for the mobile sticky bar */
  compact?: boolean;
}

const QUICK_RATIOS = [
  { label: "%80", ratio: 0.8 },
  { label: "%85", ratio: 0.85 },
  { label: "%90", ratio: 0.9 },
  { label: "%95", ratio: 0.95 },
];

export function OfferPanel({
  listingId,
  listingTitle,
  listingSlug,
  currentPrice,
  currentUserId,
  sellerId,
  compact = false,
}: OfferPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState("");
  const [message, setMessage] = useState("");

  const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);
  const isGuest = !currentUserId;

  // Don't render for own listing
  if (isOwnListing) return null;

  const parsedPrice = parseInt(offeredPrice.replace(/\D/g, ""), 10);
  const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0;
  const discount =
    isValidPrice && parsedPrice < currentPrice
      ? Math.round(((currentPrice - parsedPrice) / currentPrice) * 100)
      : null;

  function handleQuickSelect(ratio: number) {
    setOfferedPrice(String(Math.floor(currentPrice * ratio)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isValidPrice) {
      toast.error("Geçerli bir teklif fiyatı girin.");
      return;
    }

    // UX FIX: Prevent overflow for very large numbers
    if (parsedPrice > 999_999_999_999) {
      toast.error("Fiyat çok yüksek. Lütfen daha düşük bir tutar girin.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("offeredPrice", String(parsedPrice));
    formData.set("message", message);

    const result = await submitOfferAction(null, formData);
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Teklif gönderilemedi.");
      return;
    }

    toast.success("Teklifiniz satıcıya iletildi.");
    setOpen(false);
    setOfferedPrice("");
    setMessage("");
  }

  const triggerButton = compact ? (
    <button className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 text-primary h-12 px-4 text-sm font-bold transition-all hover:bg-primary/15 active:scale-95">
      <Tag className="size-4" />
      Teklif Ver
    </button>
  ) : (
    <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary h-12 px-4 text-sm font-bold transition-all hover:bg-primary/10 active:scale-95">
      <Tag className="size-4" />
      Fiyat Teklifi Ver
    </button>
  );

  // Guest: redirect to login
  if (isGuest) {
    return (
      <button
        onClick={() => router.push(`/login?next=${encodeURIComponent(`/listing/${listingSlug}`)}`)}
        className={
          compact
            ? "flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 text-primary h-12 px-4 text-sm font-bold transition-all hover:bg-primary/15 active:scale-95"
            : "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary h-12 px-4 text-sm font-bold transition-all hover:bg-primary/10 active:scale-95"
        }
      >
        <Tag className="size-4" />
        {compact ? "Teklif Ver" : "Fiyat Teklifi Ver"}
      </button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="gap-3 p-6 pb-4 border-b border-border">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="size-6" />
            </div>
            <SheetTitle className="text-left text-xl">Fiyat Teklifi Ver</SheetTitle>
            <SheetDescription className="text-left text-muted-foreground text-sm">
              <span className="font-medium text-foreground">{listingTitle}</span>
              <br />
              Satış fiyatı:{" "}
              <span className="font-bold text-foreground">{formatPrice(currentPrice)} TL</span>
            </SheetDescription>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto space-y-5 px-6 py-5">
            {/* Price input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Teklifiniz <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  TL
                </span>
                <input
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder={String(Math.floor(currentPrice * 0.9))}
                  required
                  min={1}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-xl font-bold outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Discount indicator */}
              {isValidPrice && parsedPrice < currentPrice && discount !== null && (
                <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
                  <TrendingDown className="size-3.5" />
                  <span className="text-xs font-bold">
                    %{discount} indirim — {formatPrice(currentPrice - parsedPrice)} TL tasarruf
                  </span>
                </div>
              )}
              {isValidPrice && parsedPrice >= currentPrice && (
                <p className="mt-2 text-xs text-amber-600 font-medium">
                  Teklifiniz satış fiyatına eşit veya daha yüksek.
                </p>
              )}
            </div>

            {/* Quick select buttons */}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Hızlı Seç
              </p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_RATIOS.map(({ label, ratio }) => {
                  const val = Math.floor(currentPrice * ratio);
                  const isSelected = parsedPrice === val;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleQuickSelect(ratio)}
                      className={`rounded-xl border py-2 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-[10px] font-mono mt-0.5">{(val / 1000).toFixed(0)}K</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Mesaj <span className="text-xs font-normal text-muted-foreground">(opsiyonel)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder="Teklifinizle ilgili ek bilgi verebilirsiniz..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary resize-none transition-colors"
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/500</p>
            </div>

            {/* Info box */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-[11px] uppercase tracking-widest mb-2">
                Nasıl Çalışır?
              </p>
              <p>• Teklifiniz satıcıya iletilir, 72 saat içinde yanıt beklenir.</p>
              <p>• Satıcı kabul, red veya karşı teklif yapabilir.</p>
              <p>• Teklifler dashboard &rsquo;Teklifler&rsquo; bölümünden takip edilir.</p>
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="p-6 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isLoading || !isValidPrice}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Gönderiliyor..." : "Teklifi Gönder"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
