"use client";

import { useState } from "react";
import { toast } from "sonner";

import { acceptOfferAction, counterOfferAction, rejectOfferAction } from "@/actions/offers";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface OfferActionsProps {
  offerId: string;
  /** "seller" sees accept/reject/counter; "buyer" sees accept/reject for counter offers */
  view: "seller" | "buyer";
  /** Current offer price — used for counter offer hint */
  offeredPrice?: number;
}

export function OfferActions({ offerId, view, offeredPrice }: OfferActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  async function handleAccept() {
    setIsLoading("accept");
    const result = await acceptOfferAction(offerId);
    setIsLoading(null);
    if (!result.ok) {
      toast.error(result.error ?? "İşlem başarısız.");
      return;
    }
    toast.success("Teklif kabul edildi.");
  }

  async function handleReject() {
    setIsLoading("reject");
    const result = await rejectOfferAction(offerId);
    setIsLoading(null);
    if (!result.ok) {
      toast.error(result.error ?? "İşlem başarısız.");
      return;
    }
    toast.success("Teklif reddedildi.");
  }

  async function handleCounter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const price = parseInt(counterPrice.replace(/\D/g, ""), 10);
    if (isNaN(price) || price <= 0) {
      toast.error("Geçerli bir fiyat girin.");
      return;
    }
    setIsLoading("counter");
    const result = await counterOfferAction(offerId, price, counterMessage || undefined);
    setIsLoading(null);
    if (!result.ok) {
      toast.error(result.error ?? "İşlem başarısız.");
      return;
    }
    toast.success("Karşı teklifiniz gönderildi.");
    setCounterOpen(false);
    setCounterPrice("");
    setCounterMessage("");
  }

  if (view === "buyer") {
    // Buyer responding to a counter offer
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isLoading !== null}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading === "accept" ? "..." : "Kabul Et"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isLoading !== null}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {isLoading === "reject" ? "..." : "Reddet"}
        </Button>
      </div>
    );
  }

  // Seller view: accept / reject / counter
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={isLoading !== null}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading === "accept" ? "..." : "Kabul Et"}
      </Button>

      {/* Counter offer dialog */}
      <AlertDialog open={counterOpen} onOpenChange={setCounterOpen}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isLoading !== null}>
            Karşı Teklif
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-sm">
          <form onSubmit={handleCounter}>
            <AlertDialogHeader>
              <AlertDialogTitle>Karşı Teklif Yap</AlertDialogTitle>
              <AlertDialogDescription>
                {offeredPrice && (
                  <span>
                    Alıcının teklifi: <strong>{formatPrice(offeredPrice)} TL</strong>
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Karşı Teklifiniz <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">
                    TL
                  </span>
                  <input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    placeholder="Fiyat girin"
                    required
                    min={1}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-base font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Mesaj{" "}
                  <span className="text-xs font-normal text-muted-foreground">(opsiyonel)</span>
                </label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value.slice(0, 300))}
                  placeholder="Açıklama ekleyin..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                  maxLength={300}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel type="button">Vazgeç</AlertDialogCancel>
              <Button type="submit" disabled={isLoading === "counter"}>
                {isLoading === "counter" ? "Gönderiliyor..." : "Gönder"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={isLoading !== null}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        {isLoading === "reject" ? "..." : "Reddet"}
      </Button>
    </div>
  );
}
