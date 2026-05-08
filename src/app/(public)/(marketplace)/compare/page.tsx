import { BarChart3, ChevronLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { CompareRemoveButton } from "@/features/marketplace/components/compare-remove-button";
import { CompareShareButton } from "@/features/marketplace/components/compare-share-button";
import { getMarketplaceListingsByIds } from "@/features/marketplace/services/marketplace-listings";
import { ListingCard } from "@/features/shared/components/listing-card";
import { formatNumber, formatPrice } from "@/lib";
import type { Listing } from "@/types";

export const dynamic = "force-dynamic";

interface ComparePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function parseCompareIds(idsParam: string | string[] | undefined): string[] {
  if (!idsParam) return [];

  const idsRaw = Array.isArray(idsParam) ? idsParam.join(",") : idsParam;
  const candidateIds = idsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));

  return Array.from(new Set(candidateIds)).slice(0, 4);
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const ids = parseCompareIds(resolvedSearchParams?.ids);
  const listings = ids.length > 0 ? await getMarketplaceListingsByIds(ids) : [];

  const listingsById = new Map(listings.map((listing) => [listing.id, listing]));
  const orderedListings = ids
    .map((id) => listingsById.get(id))
    .filter((listing): listing is Listing => listing !== undefined);

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 py-8 lg:px-6 lg:py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/listings"
              aria-label="İlanlara dön"
              className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-transform hover:bg-muted/30"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Araç Karşılaştırma
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Araç karşılaştır
          </h1>
          <p className="mt-2.5 text-sm font-medium leading-relaxed text-muted-foreground">
            Fiyat, kilometre ve teknik özellikleri yan yana görerek daha hızlı karar ver.
          </p>
        </div>
        {orderedListings.length > 1 && (
          <CompareShareButton ids={orderedListings.map((item) => item.id)} />
        )}
      </div>

      {orderedListings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Karşılaştırılacak ilan bulunamadı</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Karşılaştırma için en az iki ilan seçin. Listeleme sayfasından beğendiğiniz araçları
            ekleyip tekrar deneyebilirsiniz.
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            İlanlara Git
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {orderedListings.map((listing) => {
              const otherIds = orderedListings
                .filter((item) => item.id !== listing.id)
                .map((item) => item.id)
                .join(",");

              return (
                <div key={listing.id} className="relative">
                  <CompareRemoveButton otherIds={otherIds} />
                  <ListingCard listing={listing} showInsights={false} />
                </div>
              );
            })}
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Hızlı teknik karşılaştırma</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3 font-semibold">Kriter</th>
                    {orderedListings.map((listing) => (
                      <th key={listing.id} className="px-3 py-3 font-semibold">
                        {listing.brand} {listing.model}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/70">
                    <th className="px-3 py-3 font-semibold text-foreground">Fiyat</th>
                    {orderedListings.map((listing) => (
                      <td key={listing.id} className="px-3 py-3 font-medium">
                        {formatPrice(listing.price)} TL
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/70">
                    <th className="px-3 py-3 font-semibold text-foreground">Yıl</th>
                    {orderedListings.map((listing) => (
                      <td key={listing.id} className="px-3 py-3">
                        {listing.year}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/70">
                    <th className="px-3 py-3 font-semibold text-foreground">Kilometre</th>
                    {orderedListings.map((listing) => (
                      <td key={listing.id} className="px-3 py-3">
                        {formatNumber(listing.mileage)} km
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/70">
                    <th className="px-3 py-3 font-semibold text-foreground">Yakıt</th>
                    {orderedListings.map((listing) => (
                      <td key={listing.id} className="px-3 py-3">
                        {listing.fuelType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-3 py-3 font-semibold text-foreground">Şanzıman</th>
                    {orderedListings.map((listing) => (
                      <td key={listing.id} className="px-3 py-3">
                        {listing.transmission}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
