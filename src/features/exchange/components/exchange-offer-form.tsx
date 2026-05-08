"use client";

import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { submitExchangeOfferAction } from "@/actions/exchange";
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

interface ExchangeOfferFormProps {
  listingId: string;
  listingTitle: string;
  children?: React.ReactNode;
}

export function ExchangeOfferForm({ listingId, listingTitle, children }: ExchangeOfferFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    targetCarDesc: "",
    targetPrice: "",
    targetBrand: "",
    targetModel: "",
    targetYear: "",
    targetMileage: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.targetCarDesc.trim()) {
      toast.error("Aracınızı tanımlayın.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("listingId", listingId);
    formData.set("targetCarDesc", form.targetCarDesc);
    if (form.targetPrice) formData.set("targetPrice", form.targetPrice);
    if (form.targetBrand) formData.set("targetBrand", form.targetBrand);
    if (form.targetModel) formData.set("targetModel", form.targetModel);
    if (form.targetYear) formData.set("targetYear", form.targetYear);
    if (form.targetMileage) formData.set("targetMileage", form.targetMileage);
    if (form.notes) formData.set("notes", form.notes);

    const result = await submitExchangeOfferAction(null, formData);
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Teklif gönderilemedi.");
      return;
    }

    toast.success("Takas teklifiniz gönderildi.");
    setOpen(false);
    setForm({
      targetCarDesc: "",
      targetPrice: "",
      targetBrand: "",
      targetModel: "",
      targetYear: "",
      targetMileage: "",
      notes: "",
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="listingId" value={listingId} />

          <SheetHeader className="gap-4 p-6 pb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ArrowLeftRight className="size-6" />
            </div>
            <SheetTitle className="text-xl">Takas Teklifi Gönder</SheetTitle>
            <SheetDescription className="text-left text-muted-foreground">
              {listingTitle} için takas teklifinizi gönderin.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Aracınızın Açıklaması <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={form.targetCarDesc}
                onChange={(e) => setForm({ ...form, targetCarDesc: e.target.value })}
                placeholder="Örn: 2020 BMW 320i, 45.000 km, otomatik"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Marka</Label>
                <Input
                  type="text"
                  value={form.targetBrand}
                  onChange={(e) => setForm({ ...form, targetBrand: e.target.value })}
                  placeholder="BMW"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Model</Label>
                <Input
                  type="text"
                  value={form.targetModel}
                  onChange={(e) => setForm({ ...form, targetModel: e.target.value })}
                  placeholder="320i"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Yıl</Label>
                <Input
                  type="number"
                  value={form.targetYear}
                  onChange={(e) => setForm({ ...form, targetYear: e.target.value })}
                  placeholder="2020"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Km</Label>
                <Input
                  type="number"
                  value={form.targetMileage}
                  onChange={(e) => setForm({ ...form, targetMileage: e.target.value })}
                  placeholder="45000"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Fiyat (TL)</Label>
                <Input
                  type="number"
                  value={form.targetPrice}
                  onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                  placeholder="850000"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm font-medium">Not (opsiyonel)</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ek bilgiler..."
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
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
