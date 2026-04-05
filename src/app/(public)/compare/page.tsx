import { CheckCircle2, ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Listing } from "@/types";

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
      idsToCompare = resolvedParams.ids.split(",");
    }
  }

  const allListings = await getPublicMarketplaceListings();
  let cars: Listing[] = [];

  if (idsToCompare.length > 0) {
    cars = allListings.filter((l) => idsToCompare.includes(l.id));
  } else {
    // Fallback: pick the first 3
    cars = allListings.slice(0, 3);
  }

  const features: Array<{ label: string; key: keyof Listing | "coverImage"; format?: (val: any) => string }> = [
    { label: "Yil", key: "year" },
    { label: "Kilometre", key: "mileage", format: (val) => `${formatNumber(val as number)} km` },
    { label: "Yakit", key: "fuelType" },
    { label: "Vites", key: "transmission" },
    { label: "Sehir", key: "city" },
    { label: "Ilce", key: "district" },
  ];

  // Determine the AI recommended car based on lowest price / year ratio for simplicity
  const aiRecommendedCarIndex = cars.length > 0 
    ? cars.reduce((bestIndex, current, index, arr) => 
        (current.price / current.year) < (arr[bestIndex].price / arr[bestIndex].year) ? index : bestIndex
      , 0)
    : -1;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link
          href="/listings"
          className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Arac Karsilastirma</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sectiginiz {cars.length} araci detayli olarak karsilastirin.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-border/80 bg-background shadow-sm">
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="w-1/4 border-b border-border/80 bg-muted/20 p-6 align-top">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ozellikler</div>
              </th>
              {cars.map((car) => {
                const coverImage = car.images.find((img) => img.isCover) ?? car.images[0];
                return (
                  <th key={car.id} className="relative w-1/4 border-b border-l border-border/80 p-6 align-top">
                    {/* Add X button conditionally if needed later, right now static
                    <button className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-destructive">
                      <X className="size-4" />
                    </button>
                    */}
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
                    <div className="mb-1 text-lg font-bold leading-tight text-foreground line-clamp-1">{car.brand} {car.model}</div>
                    <div className="mb-3 text-sm text-muted-foreground">{car.title}</div>
                    <div className="mb-4 text-2xl font-bold text-primary">{formatCurrency(car.price)}</div>
                    <Link
                      href={`/listing/${car.slug}`}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Ilani Incele
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-border/80 bg-gradient-to-r from-primary/10 to-primary/5 p-5 font-semibold text-primary">
                Yapay Zeka Onerisi
              </td>
              {cars.map((car, idx) => (
                <td key={`ai-${car.id}`} className="border-b border-l border-border/80 bg-primary/5 p-5">
                  {idx === aiRecommendedCarIndex ? (
                    <div className="flex items-start gap-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      Fiyat/Performans acisindan en mantikli secenek.
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center">-</div>
                  )}
                </td>
              ))}
            </tr>

            {features.map((feature, idx) => (
              <tr key={feature.key} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="border-b border-border/80 p-5 font-medium text-foreground">
                  {feature.label}
                </td>
                {cars.map((car) => {
                  const val = car[feature.key as keyof Listing];
                  const displayValue = feature.format ? feature.format(val) : String(val);
                  return (
                    <td key={`${car.id}-${feature.key}`} className="border-b border-l border-border/80 p-5 text-foreground/90">
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
