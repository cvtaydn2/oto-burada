"use client";

import { Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { DopingPackage } from "@/types/payment";

interface DopingStoreProps {
  listingId: string;
}

export function DopingStore({ listingId }: DopingStoreProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: DopingPackage) => {
    try {
      setLoading(pkg.id);

      // Direct API call instead of client service
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, packageId: pkg.id }),
      });

      const res = await response.json();

      if (res.success && res.data?.paymentPageUrl) {
        // Redirect to Iyzico checkout page
        window.location.href = res.data.paymentPageUrl;
      } else {
        toast.error(res.error?.message || "Ödeme başlatılamadı.");
      }
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {DOPING_PACKAGES.map((pkg) => (
        <Card
          key={pkg.id}
          className="relative overflow-hidden flex flex-col hover:border-blue-500/50 transition-all"
        >
          {pkg.type === "top_rank" && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider z-10">
              Popüler
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
              {pkg.name}
            </CardTitle>
            <CardDescription className="font-medium">
              {pkg.durationDays > 0 ? `${pkg.durationDays} Gün Boyunca` : "Tek Kullanım"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="text-3xl font-bold text-slate-900 mb-6">
              {pkg.price} <span className="text-sm font-medium text-slate-400">₺</span>
            </div>
            <ul className="space-y-3">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs"
              onClick={() => handlePurchase(pkg)}
              disabled={loading === pkg.id}
            >
              {loading === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Satın Al"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
