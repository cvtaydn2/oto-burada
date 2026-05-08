"use client";

import { DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { submitOfferAction } from "@/actions/offers";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/features/ui/components/sheet";
import { formatPrice } from "@/lib";

interface OfferFormProps {
  listingId: string;
  listingTitle: string;
  currentPrice: number;
  children?: React.ReactNode;
}

export function OfferForm({ listingId, listingTitle, currentPrice, children }: OfferFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const price = parseInt(offeredPrice, 10);
    if (isNaN(price)) {
      toast.error("Geçerli bir fiyat girin.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("listingId", listingId);
    formData.set("offeredPrice", offeredPrice);
    formData.set("message", message);

    const result = await submitOfferAction(null, formData);
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Teklif gönderilemedi.");
      return;
    }

    toast.success("Teklifiniz gönderildi.");
    setOpen(false);
    setOfferedPrice("");
    setMessage("");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="listingId" value={listingId} />

          <SheetHeader className="gap-4 p-6 pb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="size-6" />
            </div>
            <SheetTitle className="text-xl">Teklif Yap</SheetTitle>
            <SheetDescription className="text-left text-muted-foreground">
              {listingTitle} — {formatPrice(currentPrice)} TL
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Teklifiniz <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder="Örn: 850000"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 pl-12 text-lg font-bold outline-none focus:border-primary"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  TL
                </span>
              </div>
              <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                <Button
                  type="button"
                  onClick={() => setOfferedPrice(String(Math.floor(currentPrice * 0.8)))}
                  className="hover:text-foreground underline"
                >
                  %80
                </Button>
                <Button
                  type="button"
                  onClick={() => setOfferedPrice(String(Math.floor(currentPrice * 0.9)))}
                  className="hover:text-foreground underline"
                >
                  %90
                </Button>
                <Button
                  type="button"
                  onClick={() => setOfferedPrice(String(currentPrice))}
                  className="hover:text-foreground underline"
                >
                  %100
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">Mesaj (opsiyonel)</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder="Ek detaylar..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">{message.length}/500</p>
            </div>
          </div>

          <SheetFooter className="p-6 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? "Gönderiliyor..." : "Teklif Gönder"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
