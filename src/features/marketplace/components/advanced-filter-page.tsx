"use client";

import { ArrowLeft, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useAuthUser } from "@/components/shared/auth-provider";
import { Panel } from "@/components/shared/design-system/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterFields } from "@/features/marketplace/components/filter-fields";
import { SaveSearchButton } from "@/features/marketplace/components/save-search-button";
import { useFilterResultCount } from "@/features/marketplace/hooks/use-filter-result-count";
import { useUnifiedFilters } from "@/features/marketplace/hooks/use-unified-filters";
import { createSearchParamsFromListingFilters } from "@/features/marketplace/services/listing-filters";
import { maximumCarYear } from "@/lib/domain";
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
    <div className="min-h-screen bg-muted/30 pb-24 sm:pb-28">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:py-10">
        <main className="flex min-h-[560px] flex-1 flex-col rounded-[1.75rem] border border-border/40 bg-card p-4 shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">
          <div className="mb-6 flex flex-col gap-4 border-b border-border/40 pb-5 sm:mb-8 sm:gap-5 sm:pb-6 lg:mb-10 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:pb-8">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <Link
                href="/listings"
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-card text-muted-foreground transition-all hover:text-primary"
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  Gelişmiş Filtreleme
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Marka, fiyat, konum ve ekspertiz kriterlerini tek akışta düzenleyin.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
              <Button
                onClick={resetFilters}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:bg-muted/50 sm:flex-1 lg:min-w-[120px] lg:flex-none"
              >
                <RotateCcw size={14} />
                Sıfırla
              </Button>
              <SaveSearchButton filters={filters} resultCount={resultCount} userId={userId} />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-bold text-primary sm:flex-row sm:flex-wrap sm:items-center lg:mb-10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} />
                <span>{activeCount} aktif filtre</span>
              </div>
              <Button
                onClick={resetFilters}
                className="min-h-10 w-full rounded-lg px-3 text-rose-500 hover:bg-rose-50/50 hover:text-rose-600 sm:ml-auto sm:min-h-8 sm:w-auto"
              >
                Tümünü Temizle
              </Button>
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
                  <Label className="px-1 text-xs font-bold tracking-wide text-muted-foreground">
                    Maksimum KM
                  </Label>
                  <Input
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
                  <Label className="px-1 text-xs font-bold tracking-wide text-muted-foreground">
                    Maks. Tramer Hasar Kaydı (TL)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Örn: 15.000"
                    value={filters.maxTramer ?? ""}
                    onChange={(e) =>
                      updateFilter("maxTramer", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="h-12 w-full rounded-xl border border-border/40 bg-muted/20 px-4 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-muted/5 p-4 transition-all hover:bg-muted/10">
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
                </Label>
              </div>
            </Panel>
          </div>

          <div className="sticky bottom-2 mt-8 rounded-2xl border border-border/50 bg-card/95 p-3 shadow-lg backdrop-blur sm:bottom-3 sm:mt-10 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {isCounting ? "..." : resultCount.toLocaleString("tr-TR")} ilan eşleşti
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Filtreleri uygulayarak sonuç sayfasına dönün.
                </p>
              </div>
              <Button
                onClick={handleApply}
                disabled={isPending}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70 sm:w-auto sm:min-w-[220px]"
              >
                <Search size={14} />
                <span className="truncate">
                  {isPending
                    ? "Uygulanıyor..."
                    : `${resultCount.toLocaleString("tr-TR")} ilanı göster`}
                </span>
              </Button>
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
