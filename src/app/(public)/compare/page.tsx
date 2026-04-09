import type { Metadata } from "next";
import { CheckCircle2, ChevronLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";
import { CompareRemoveButton } from "@/components/listings/compare-remove-button";

export const metadata: Metadata = {
  title: "Araç Karşılaştırma",
  description: "Seçtiğiniz araçları yan yana koyarak fiyat, kilometre, yakıt ve diğer özelliklerini karşılaştırın.",
};

interface ComparePageProps {
  searchParams: Promise<{
    ids?: string | string[];
  }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolvedParams = await searchParams;
  let idsToCompare: string[] = [];

  if (resolvedParams.ids) {
    if (Array.isArray(resolvedParams.ids)) {
      idsToCompare = resolvedParams.ids;
    } else {
      idsToCompare = resolvedParams.ids.split(",").filter(Boolean);
    }
  }

  const allListings = await getPublicMarketplaceListings();
  let cars: Listing[] = [];

  if (idsToCompare.length > 0) {
    cars = allListings.filter((l) => idsToCompare.includes(l.id));
  }

  if (cars.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Karşılaştırılacak araç yok</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          İlan listesinden &quot;Karşılaştır&quot; butonuna tıklayarak araç ekleyin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          İlanlara Git
        </Link>
      </div>
    );
  }

  const features: Array<{
    label: string;
    render: (car: Listing) => string;
  }> = [
    { label: "Fiyat", render: (car) => formatCurrency(car.price) },
    { label: "Yıl", render: (car) => String(car.year) },
    { label: "Kilometre", render: (car) => `${formatNumber(car.mileage)} km` },
    { label: "Yakıt", render: (car) => car.fuelType },
    { label: "Vites", render: (car) => car.transmission },
    { label: "Şehir", render: (car) => `${car.city} / ${car.district}` },
    {
      label: "Tramer",
      render: (car) =>
        car.tramerAmount != null
          ? car.tramerAmount === 0
            ? "Tramer kaydı yok ✓"
            : formatCurrency(car.tramerAmount)
          : "Belirtilmemiş",
    },
    {
      label: "Ekspertiz Belgesi",
      render: (car) =>
        car.expertInspection?.hasInspection
          ? car.expertInspection.documentUrl
            ? "Belge mevcut ✓"
            : "Ekspertizli"
          : "Yok",
    },
  ];

  // Best value heuristic: lowest (price / year)
  const bestValueIndex = cars.reduce(
    (best, current, index, arr) =>
      current.price / current.year < arr[best].price / arr[best].year
        ? index
        : best,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Araç Karşılaştırma
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cars.length} aracı detaylı olarak karşılaştırın.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-border/80 bg-background shadow-sm">
        <table className="min-w-[700px] w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-40 border-b border-border/80 bg-muted/20 p-5 align-top">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Özellikler
                </div>
              </th>
              {cars.map((car) => {
                const coverImage =
                  car.images.find((img) => img.isCover) ?? car.images[0];
                const otherIds = cars
                  .filter((c) => c.id !== car.id)
                  .map((c) => c.id)
                  .join(",");

                return (
                  <th
                    key={car.id}
                    className="relative border-b border-l border-border/80 p-5 align-top"
                  >
                    <CompareRemoveButton otherIds={otherIds} />
                    <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] bg-muted shadow-sm">
                      {coverImage ? (
                        <Image
                          src={coverImage.url}
                          alt={car.title}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="mb-1 text-lg font-bold leading-tight text-foreground line-clamp-1">
                      {car.brand} {car.model}
                    </div>
                    <div className="mb-3 text-sm text-muted-foreground line-clamp-1">
                      {car.title}
                    </div>
                    <div className="mb-4 text-2xl font-bold text-primary">
                      {formatCurrency(car.price)}
                    </div>
                    <Link
                      href={`/listing/${car.slug}`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      İlanı İncele
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Best value recommendation */}
            <tr>
              <td className="border-b border-border/80 bg-gradient-to-r from-primary/10 to-primary/5 p-5 font-semibold text-primary">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4" />
                  Öneri
                </div>
              </td>
              {cars.map((car, idx) => (
                <td
                  key={`ai-${car.id}`}
                  className="border-b border-l border-border/80 bg-primary/5 p-5"
                >
                  {idx === bestValueIndex ? (
                    <div className="flex items-start gap-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      Fiyat/Performans açısından en iyi seçenek
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center">
                      —
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Feature rows */}
            {features.map((feature, idx) => (
              <tr
                key={feature.label}
                className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="border-b border-border/80 p-5 font-medium text-foreground">
                  {feature.label}
                </td>
                {cars.map((car) => {
                  const value = feature.render(car);
                  const isPositive = value.includes("✓");
                  return (
                    <td
                      key={`${car.id}-${feature.label}`}
                      className={`border-b border-l border-border/80 p-5 ${
                        isPositive
                          ? "font-semibold text-emerald-600"
                          : "text-foreground/90"
                      }`}
                    >
                      {isPositive && (
                        <CheckCircle2 className="mr-1.5 inline size-4 text-emerald-500" />
                      )}
                      {value.replace(" ✓", "")}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Tramer warning row */}
            {cars.some(
              (car) => car.tramerAmount != null && car.tramerAmount > 0,
            ) && (
              <tr>
                <td className="border-b border-border/80 bg-amber-50/50 p-5 font-medium text-amber-700">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-4" />
                    Tramer Uyarısı
                  </div>
                </td>
                {cars.map((car) => (
                  <td
                    key={`tramer-warn-${car.id}`}
                    className="border-b border-l border-border/80 bg-amber-50/30 p-5 text-sm text-amber-700"
                  >
                    {car.tramerAmount != null && car.tramerAmount > 0
                      ? `${formatCurrency(car.tramerAmount)} hasar kaydı mevcut`
                      : "Temiz"}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
