"use client";

import { Check, Loader2, MapPin, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getListingDopingDisplayItems,
  getListingDopingStatusTone,
} from "@/features/marketplace/lib/utils";
import { Button } from "@/features/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/ui/components/card";
import { formatCurrency, formatDate } from "@/lib";
import { DOPING_PACKAGES, getDopingPackageByType } from "@/lib/doping";
import type { Listing } from "@/types";
import { DopingPackage } from "@/types/payment";

interface DopingStoreProps {
  listing: Listing;
}

export function DopingStore({ listing }: DopingStoreProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const activeDopings = useMemo(
    () =>
      getListingDopingDisplayItems(listing)
        .map((item) => {
          const pkg = getDopingPackageByType(item.type);
          if (!pkg) return null;

          return {
            ...item,
            packageName: pkg.name,
            surfaces: pkg.surfaces,
            tone: getListingDopingStatusTone(item.expiresAt),
          };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null),
    [listing]
  );

  const handlePurchase = async (pkg: DopingPackage) => {
    try {
      setLoading(pkg.id);

      // Direct API call instead of client service
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, packageId: pkg.id }),
      });

      const res = await response.json();

      if (res.success && res.data?.paymentPageUrl) {
        // Redirect to Iyzico checkout page
        // eslint-disable-next-line react-hooks/immutability
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Satın aldığınız aktif dopingler
        </p>
        <h4 className="mt-1 text-lg font-bold text-foreground">{listing.title}</h4>
        {activeDopings.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeDopings.map((doping) => (
              <div
                key={`${listing.id}-${doping.type}`}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-900">{doping.label}</p>
                    <p className="text-xs font-medium text-emerald-700/80">{doping.packageName}</p>
                  </div>
                  <span
                    className={
                      doping.tone === "expiring"
                        ? "rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                        : doping.tone === "single_use"
                          ? "rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                          : "rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    }
                  >
                    {doping.tone === "expiring"
                      ? "Yakında bitecek"
                      : doping.tone === "single_use"
                        ? "Uygulandı"
                        : "Aktif"}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-emerald-900/80">
                  <p>
                    {doping.expiresAt
                      ? `Bitiş: ${formatDate(doping.expiresAt)}`
                      : "Tek kullanımlı görünürlük etkisi uygulandı."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doping.surfaces.map((surface) => (
                      <span
                        key={surface}
                        className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-800"
                      >
                        {surface}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Bu ilan için şu anda aktif bir doping bulunmuyor. Satın aldığınız paketler burada
            birebir hangi yüzeyde göründüğüyle birlikte listelenir.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {DOPING_PACKAGES.map((pkg) => {
          const isActive = activeDopings.some((doping) => doping.type === pkg.type);

          return (
            <Card
              key={pkg.id}
              className="relative flex flex-col overflow-hidden transition-all hover:border-blue-500/50"
            >
              {pkg.type === "top_rank" && (
                <div className="absolute right-0 top-0 z-10 rounded-bl-lg bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Popüler
                </div>
              )}
              {isActive && (
                <div className="absolute left-0 top-0 z-10 rounded-br-lg bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Aktif paketin
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
                  {pkg.name}
                </CardTitle>
                <CardDescription className="font-medium">
                  {pkg.durationDays > 0 ? `${pkg.durationDays} gün boyunca` : "Tek kullanım"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-grow flex-col gap-5">
                <div>
                  <div className="mb-2 text-3xl font-bold text-slate-900">
                    {formatCurrency(pkg.price)}
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-600">
                    {pkg.summary}
                  </p>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <MapPin className="size-3.5" />
                    Nerede görünür?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.surfaces.map((surface) => (
                      <span
                        key={surface}
                        className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold text-foreground"
                      >
                        {surface}
                      </span>
                    ))}
                  </div>
                </div>

                <ul className="space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm font-medium text-slate-600"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-3">
                <Button
                  className="h-12 w-full rounded-xl text-xs font-bold uppercase tracking-widest"
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading === pkg.id}
                >
                  {loading === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Satın Al"}
                </Button>
                {isActive && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <Sparkles className="size-4" />
                    Bu görünürlük etkisi şu anda ilanda aktif.
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
