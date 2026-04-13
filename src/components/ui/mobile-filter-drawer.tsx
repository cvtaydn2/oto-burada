"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ListingFilters, BrandCatalogItem, CityOption } from "@/types";

interface MobileFilterDrawerProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  onFilterChange: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  onReset: () => void;
  activeCount: number;
}

const FUEL_TYPES = [
  { value: "benzin", label: "Benzin" },
  { value: "dizel", label: "Dizel" },
  { value: "lpg", label: "LPG" },
  { value: "elektrik", label: "Elektrik" },
  { value: "hibrit", label: "Hibrit" },
];

const TRANSMISSION_TYPES = [
  { value: "otomatik", label: "Otomatik" },
  { value: "manuel", label: "Manuel" },
  { value: "yarı-otomatik", label: "Yarı Otomatik" },
];

export function MobileFilterDrawer({
  brands,
  cities,
  filters,
  onFilterChange,
  onReset,
  activeCount,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("brand");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleBrandSelect = (brand: string) => {
    onFilterChange("brand", filters.brand === brand ? undefined : brand);
    setExpandedSection(null);
  };

  const handleCitySelect = (city: string, citySlug: string) => {
    onFilterChange("city", filters.city === city ? undefined : city);
    onFilterChange("citySlug", filters.citySlug === citySlug ? undefined : citySlug);
  };

  const handleFuelSelect = (fuel: string) => {
    const currentFuel = Array.isArray(filters.fuelType) ? filters.fuelType : filters.fuelType?.split(",").filter(Boolean) || [];
    const newFuel = currentFuel.includes(fuel)
      ? currentFuel.filter((f) => f !== fuel)
      : [...currentFuel, fuel];
    onFilterChange("fuelType", newFuel.length > 0 ? newFuel.join(",") as ListingFilters["fuelType"] : undefined);
  };

  const handleTransmissionSelect = (transmission: string) => {
    onFilterChange("transmission", filters.transmission === transmission ? undefined : transmission);
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const handleReset = () => {
    onReset();
    router.push(pathname, { scroll: false });
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filtreler
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs font-medium">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-background animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">Filtreler</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto pb-24" style={{ maxHeight: "calc(85vh - 120px)" }}>
              <div className="divide-y">
                <FilterSection
                  title="Marka"
                  isExpanded={expandedSection === "brand"}
                  onToggle={() => toggleSection("brand")}
                >
                  <div className="grid grid-cols-2 gap-2 py-2">
                    {brands.slice(0, 20).map((brand) => (
                      <button
                        key={brand.slug}
                        onClick={() => handleBrandSelect(brand.slug)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                          filters.brand === brand.slug
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Şehir"
                  isExpanded={expandedSection === "city"}
                  onToggle={() => toggleSection("city")}
                >
                  <div className="grid grid-cols-2 gap-2 py-2">
                    {cities.slice(0, 20).map((city) => (
                      <button
                        key={city.city}
                        onClick={() => handleCitySelect(city.city, city.slug)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                          filters.city === city.city
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {city.city}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Fiyat Aralığı"
                  isExpanded={expandedSection === "price"}
                  onToggle={() => toggleSection("price")}
                >
                  <div className="flex gap-2 py-2">
                    <input
                      type="number"
                      placeholder="Min fiyat"
                      value={filters.minPrice || ""}
                      onChange={(e) => onFilterChange("minPrice", e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max fiyat"
                      value={filters.maxPrice || ""}
                      onChange={(e) => onFilterChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </div>
                </FilterSection>

                <FilterSection
                  title="Yakıt Türü"
                  isExpanded={expandedSection === "fuel"}
                  onToggle={() => toggleSection("fuel")}
                >
                  <div className="flex flex-wrap gap-2 py-2">
                    {FUEL_TYPES.map((fuel) => (
                      <button
                        key={fuel.value}
                        onClick={() => handleFuelSelect(fuel.value)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm transition-colors",
                          filters.fuelType?.includes(fuel.value)
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {fuel.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Vites"
                  isExpanded={expandedSection === "transmission"}
                  onToggle={() => toggleSection("transmission")}
                >
                  <div className="flex flex-wrap gap-2 py-2">
                    {TRANSMISSION_TYPES.map((trans) => (
                      <button
                        key={trans.value}
                        onClick={() => handleTransmissionSelect(trans.value)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm transition-colors",
                          filters.transmission === trans.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {trans.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Yıl"
                  isExpanded={expandedSection === "year"}
                  onToggle={() => toggleSection("year")}
                >
                  <div className="flex gap-2 py-2">
                    <input
                      type="number"
                      placeholder="Min yıl"
                      value={filters.minYear || ""}
                      onChange={(e) => onFilterChange("minYear", e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max yıl"
                      value={filters.maxYear || ""}
                      onChange={(e) => onFilterChange("maxYear", e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </div>
                </FilterSection>

                <FilterSection
                  title="Kilometre"
                  isExpanded={expandedSection === "mileage"}
                  onToggle={() => toggleSection("mileage")}
                >
                  <div className="flex gap-2 py-2">
                    <input
                      type="number"
                      placeholder="Min km"
                      value={filters.maxMileage ? filters.maxMileage : ""}
                      onChange={(e) => onFilterChange("maxMileage", e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                    />
                  </div>
                </FilterSection>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex gap-2 border-t bg-background p-4">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Temizle
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Uygula ({activeCount})
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="px-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left font-medium"
      >
        {title}
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      {isExpanded && children}
    </div>
  );
}