"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  Search,
  SlidersHorizontal,
  MapPin,
  Gauge,
  Car,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ListingFilters, type BrandCatalogItem, type CityOption } from "@/types";
import { Panel } from "@/components/shared/design-system/Panel";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { useAuthUser } from "@/components/shared/auth-provider";
import { useUnifiedFilters } from "@/features/marketplace/hooks/use-unified-filters";
import { useFilterResultCount } from "@/features/marketplace/hooks/use-filter-result-count";

import { FilterFields } from "@/features/marketplace/components/filter-fields";
import { maximumCarYear } from "@/lib/constants/domain";

interface AdvancedFilterPageProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
  totalCount: number;
}

type FilterSection = "brand" | "price" | "year" | "location" | "technical" | "trust";

export function AdvancedFilterPage({
  brands,
  cities,
  initialFilters,
  totalCount,
}: AdvancedFilterPageProps) {
  const router = useRouter();
  const {
    filters,
    updateFilter,
    resetFilters,
    activeCount,
    isPending
  } = useUnifiedFilters(initialFilters);

  const [activeSection, setActiveSection] = useState<FilterSection>("brand");
  const { count: resultCount, isLoading: isCounting } = useFilterResultCount(filters, totalCount);
  const { userId } = useAuthUser();

  const handleApply = useCallback(() => {
    const params = createSearchParamsFromListingFilters({ ...filters, page: 1 });
    router.push(`/listings?${params.toString()}`);
  }, [filters, router]);

  const SECTIONS: { id: FilterSection; label: string; icon: React.ReactNode }[] = [
    { id: "brand", label: "Temel Bilgiler", icon: <Car size={16} /> },
    { id: "price", label: "Fiyat & KM", icon: <Gauge size={16} /> },
    { id: "year", label: "Model Yılı", icon: <SlidersHorizontal size={16} /> },
    { id: "location", label: "Konum", icon: <MapPin size={16} /> },
    { id: "technical", label: "Teknik", icon: <Zap size={16} /> },
    { id: "trust", label: "Ekspertiz", icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-72 shrink-0">
          <Panel padding="none" className="overflow-hidden sticky top-24">
            <div className="p-3">
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </Panel>
        </aside>

        <main className="flex-1 bg-card border border-border/40 rounded-3xl p-8 md:p-12 shadow-sm min-h-[600px] flex flex-col">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 pb-8 border-b border-border/40 gap-6">
            <div className="flex items-center gap-4">
              <Link href="/listings" className="flex size-10 items-center justify-center rounded-2xl border border-border/40 bg-card text-muted-foreground hover:text-primary transition-all">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Gelişmiş Filtreleme</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button onClick={resetFilters} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-card border border-border/40 text-muted-foreground px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/50 transition-all">
                <RotateCcw size={14} />
                Sıfırla
              </button>
              <SaveSearchButton filters={filters} resultCount={resultCount} userId={userId} />
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg disabled:opacity-70"
              >
                <Search size={14} />
                {isPending ? "..." : `İLANLARI GÖR (${resultCount.toLocaleString("tr-TR")})`}
              </button>
            </div>
          </div>

          <div className="flex-1">
            {activeCount > 0 && (
              <div className="mb-10 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/5 border border-primary/10 rounded-2xl px-6 py-3">
                <SlidersHorizontal size={14} />
                <span>{activeCount} aktif filtre</span>
                <button onClick={resetFilters} className="ml-auto text-rose-500 hover:text-rose-600 transition-colors">
                  Tümünü Temizle
                </button>
              </div>
            )}

            <div className="max-w-3xl">
              {activeSection === "brand" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <FilterFields.Brand brands={brands} value={filters.brand} onChange={v => updateFilter("brand", v)} />
                  <FilterFields.Model brands={brands} brand={filters.brand} value={filters.model} onChange={v => updateFilter("model", v)} />
                </div>
              )}

              {activeSection === "price" && (
                <div className="space-y-10">
                  <FilterFields.Range
                    label="Fiyat Aralığı"
                    unit="TL"
                    min={filters.minPrice}
                    max={filters.maxPrice}
                    minPlaceholder="Min"
                    maxPlaceholder="Max"
                    onMinChange={v => updateFilter("minPrice", v)}
                    onMaxChange={v => updateFilter("maxPrice", v)}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Maksimum KM</label>
                    <input
                      type="number"
                      placeholder="Örn: 100.000"
                      value={filters.maxMileage ?? ""}
                      onChange={(e) => updateFilter("maxMileage", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full h-12 border border-border/40 rounded-xl px-4 py-2 text-sm bg-muted/20 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>
              )}

              {activeSection === "year" && (
                <FilterFields.Range
                  label="Model Yılı"
                  unit="Yıl"
                  min={filters.minYear}
                  max={filters.maxYear}
                  minPlaceholder="1950"
                  maxPlaceholder={String(maximumCarYear)}
                  onMinChange={v => updateFilter("minYear", v)}
                  onMaxChange={v => updateFilter("maxYear", v)}
                />
              )}

              {activeSection === "location" && (
                <FilterFields.Location 
                  cities={cities} 
                  city={filters.city} 
                  district={filters.district}
                  onCityChange={v => updateFilter("city", v)}
                  onDistrictChange={v => updateFilter("district", v)}
                />
              )}

              {activeSection === "technical" && (
                <FilterFields.Technical 
                  fuelType={filters.fuelType}
                  transmission={filters.transmission}
                  onFuelChange={v => updateFilter("fuelType", v)}
                  onTransmissionChange={v => updateFilter("transmission", v)}
                />
              )}

              {activeSection === "trust" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Maks. Tramer Hashar Kaydı (TL)</label>
                    <input
                      type="number"
                      placeholder="Örn: 15.000"
                      value={filters.maxTramer ?? ""}
                      onChange={(e) => updateFilter("maxTramer", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full h-12 border border-border/40 rounded-xl px-4 py-2 text-sm bg-muted/20 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group bg-muted/5 p-4 rounded-xl border border-border/40 hover:bg-muted/10 transition-all">
                    <input
                      type="checkbox"
                      checked={filters.hasExpertReport === true}
                      onChange={() => updateFilter("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                      className="size-5 rounded-lg border-muted/50 text-primary focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-foreground/80 group-hover:text-foreground">Ekspertiz raporlu ilanlar</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-10 border-t border-border/40 flex justify-between items-center bg-card/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">
              <span className="text-foreground">{isCounting ? "..." : resultCount.toLocaleString("tr-TR")}</span> İlan Eşleşti
            </p>
            <button
              onClick={handleApply}
              disabled={isPending}
              className="bg-primary text-primary-foreground px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 disabled:opacity-70"
            >
              {isPending ? "..." : "SONUÇLARI GÖSTER"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
