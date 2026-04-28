"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createReservationAction } from "@/actions/reservations";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { reservation as copy } from "@/lib/constants/ui-strings";
import { cn } from "@/lib/utils";

interface ReserveButtonProps {
  listingId: string;
  className?: string;
}

export function ReserveButton({ listingId, className }: ReserveButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("listingId", listingId);
    formData.set("notes", notes);

    const result = await createReservationAction(null, formData);
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Bir hata oluştu.");
      return;
    }

    toast.success("Kapora rezervasyonu oluşturuldu.");
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "relative flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary h-12 px-4 text-sm font-bold transition-all hover:bg-primary/10 active:scale-95",
            className
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{copy.reserveButton}</span>
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase">
            {copy.reserveButtonBadge}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="gap-4 p-6 pb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <SheetTitle className="text-left text-xl">{copy.reserveButton}</SheetTitle>
            <SheetDescription className="text-left text-muted-foreground">
              {copy.policyNote}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{copy.depositAmount}</span>
                <input
                  type="number"
                  name="amountDeposit"
                  min="1000"
                  step="500"
                  placeholder="Örn: 5000"
                  required
                  className="w-32 text-right font-mono font-semibold bg-transparent border-0 outline-none focus:ring-0"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{copy.platformFee} (%2.5)</span>
                <span className="font-mono text-xs">otomatik hesaplanır</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Not (opsiyonel)
              </label>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Randevu tarihi, sorularınız..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                maxLength={500}
              />
            </div>
          </div>

          <SheetFooter className="p-6 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? "İşleniyor..." : "Ödemeye Geç"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
