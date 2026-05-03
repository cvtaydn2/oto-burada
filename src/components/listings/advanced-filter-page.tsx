"use client";

import { ArrowLeft, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { SaveSearchButton } from "@/components/listings/save-search-button";
import { useAuthUser } from "@/components/shared/auth-provider";
import { Panel } from "@/components/shared/design-system/Panel";
import { FilterFields } from "@/features/marketplace/components/filter-fields";
import { useFilterResultCount } from "@/features/marketplace/hooks/use-filter-result-count";
import { useUnifiedFilters } from "@/features/marketplace/hooks/use-unified-filters";
import { maximumCarYear } from "@/lib/constants/domain";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { type BrandCatalogItem, type CityOption, type ListingFilters } from "@/types";

interface AdvancedFilterPageProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
  totalCount: number;
}

export function AdvancedFilterPage({
  brands,
  cities,
  initialFilters,
  totalCount,
}: AdvancedFilterPageProps) {
  const router = useRouter();
  const { filters, updateFilter, resetFilters, activeCount, isPending } =
    useUnifiedFilters(initialFilters);

  const { count: resultCount, isLoading: isCounting } = useFilterResultCount(filters, totalCount);
  const { userId } = useAuthUser();

  const handleApply = useCallback(() => {
    const params = createSearchParamsFromListingFilters({ ...filters, page: 1 });
    router.push(`/listings?${params.toString()}`);
  }, [filters, router]);

  return (
    <div className="min-h-screen bg-muted/30 pb-28">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <main className="flex min-h-[560px] flex-1 flex-col rounded-3xl border border-border/40 bg-card p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-5 border-b border-border/40 pb-6 lg:mb-10 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:pb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/listings"
                className="flex size-10 items-center justify-center rounded-2xl border border-border/40 bg-card text-muted-foreground transition-all hover:text-primary"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Gelişmiş Filtreleme
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marka, fiyat, konum ve ekspertiz kriterlerini tek akışta düzenleyin.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-card px-5 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:bg-muted/50 sm:flex-1 lg:flex-none"
              >
                <RotateCcw size={14} />
                Sıfırla
              </button>
              <SaveSearchButton filters={filters} resultCount={resultCount} userId={userId} />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-bold text-primary lg:mb-10">
              <SlidersHorizontal size={14} />
              <span>{activeCount} aktif filtre</span>
              <button onClick={resetFilters} className="ml-auto text-rose-500 hover:text-rose-600">
                Tümünü Temizle
              </button>
            </div>
          )}

          <div className="space-y-6">
            <Panel className="p-5 sm:p-6">
              <SectionHeader
                title="Temel Bilgiler"
                description="Marka ve model seçerek başlayın."
              />
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FilterFields.Brand
                  brands={brands}
                  value={filters.brand}
                  onChange={(v) => updateFilter("brand", v)}
                />
                <FilterFields.Model
                  brands={brands}
                  brand={filters.brand}
                  value={filters.model}
                  onChange={(v) => updateFilter("model", v)}
                />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <SectionHeader
                title="Konum"
                description="Şehir ve ilçe ile yakın çevredeki ilanları bulun."
              />
              <div className="mt-5">
                <FilterFields.Location
                  cities={cities}
                  city={filters.city}
                  district={filters.district}
                  onCityChange={(v) => updateFilter("city", v)}
                  onDistrictChange={(v) => updateFilter("district", v)}
                />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <SectionHeader
                title="Fiyat & KM"
                description="Bütçenize ve kullanım durumuna göre daraltın."
              />
              <div className="mt-5 space-y-8">
                <FilterFields.Range
                  label="Fiyat Aralığı"
                  unit="TL"
                  min={filters.minPrice}
                  max={filters.maxPrice}
                  minPlaceholder="Min"
                  maxPlaceholder="Max"
                  onMinChange={(v) => updateFilter("minPrice", v)}
                  onMaxChange={(v) => updateFilter("maxPrice", v)}
                />
                <div className="space-y-1.5">
                  <label className="px-1 text-xs font-bold tracking-wide text-muted-foreground">
                    Maksimum KM
                  </label>
                  <input
                    type="number"
                    placeholder="Örn: 100.000"
                    value={filters.maxMileage ?? ""}
                    onChange={(e) =>
                      updateFilter(
                        "maxMileage",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <SectionHeader
                title="Model Yılı"
                description="Yıl aralığı ile araç yaşını filtreleyin."
              />
              <div className="mt-5">
                <FilterFields.Range
                  label="Model Yılı"
                  unit="Yıl"
                  min={filters.minYear}
                  max={filters.maxYear}
                  minPlaceholder="1950"
                  maxPlaceholder={String(maximumCarYear)}
                  onMinChange={(v) => updateFilter("minYear", v)}
                  onMaxChange={(v) => updateFilter("maxYear", v)}
                />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <SectionHeader
                title="Teknik Özellikler"
                description="Yakıt türü ve şanzıman tercihinizi belirtin."
              />
              <div className="mt-5">
                <FilterFields.Technical
                  fuelType={filters.fuelType}
                  transmission={filters.transmission}
                  onFuelChange={(v) => updateFilter("fuelType", v)}
                  onTransmissionChange={(v) => updateFilter("transmission", v)}
                />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <SectionHeader
                title="Ekspertiz & Hasar"
                description="Güven odaklı filtrelerle daha net sonuçlar alın."
              />
              <div className="mt-5 grid grid-cols-1 items-end gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="px-1 text-xs font-bold tracking-wide text-muted-foreground">
                    Maks. Tramer Hasar Kaydı (TL)
                  </label>
                  <input
                    type="number"
                    placeholder="Örn: 15.000"
                    value={filters.maxTramer ?? ""}
                    onChange={(e) =>
                      updateFilter("maxTramer", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-muted/5 p-4 transition-all hover:bg-muted/10">
                  <input
                    type="checkbox"
                    checked={filters.hasExpertReport === true}
                    onChange={() =>
                      updateFilter("hasExpertReport", filters.hasExpertReport ? undefined : true)
                    }
                    className="size-5 cursor-pointer rounded-lg border-muted/50 text-primary focus:ring-0"
                  />
                  <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground">
                    Ekspertiz raporlu ilanlar
                  </span>
                </label>
              </div>
            </Panel>
          </div>

          <div className="sticky bottom-3 mt-8 rounded-2xl border border-border/40 bg-card/95 p-4 shadow-lg backdrop-blur sm:mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {isCounting ? "..." : resultCount.toLocaleString("tr-TR")} ilan eşleşti
                </p>
                <p className="text-xs text-muted-foreground">
                  Filtreleri uygulayarak sonuç sayfasına dönün.
                </p>
              </div>
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
              >
                <Search size={14} />
                {isPending
                  ? "Uygulanıyor..."
                  : `${resultCount.toLocaleString("tr-TR")} ilanı göster`}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
