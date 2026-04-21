"use client";

import { useState, useCallback, useEffect, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RotateCcw, Search,
  SlidersHorizontal, MapPin, Gauge, Car, Zap, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingFilters, BrandCatalogItem, CityOption } from "@/types";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { useAuthUser } from "@/components/shared/auth-provider";
import { useUnifiedFilters } from "@/features/marketplace/hooks/use-unified-filters";

interface AdvancedFilterPageProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialFilters: ListingFilters;
  totalCount: number;
}

const FUEL_OPTIONS = [
  { value: "benzin", label: "Benzin" },
  { value: "dizel", label: "Dizel" },
  { value: "hibrit", label: "Hibrit" },
  { value: "elektrik", label: "Elektrik" },
  { value: "lpg", label: "LPG" },
];

const TRANSMISSION_OPTIONS = [
  { value: "manuel", label: "Manuel" },
  { value: "otomatik", label: "Otomatik" },
  { value: "yari_otomatik", label: "Yarı Otomatik" },
];

const CURRENT_YEAR = 2026; 

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
  const [resultCount, setResultCount] = useState(totalCount);
  const [isCounting, setIsCounting] = useState(false);
  const deferredFilters = useDeferredValue(filters);
  const { userId } = useAuthUser();

  const models = (brands.find(b => b.brand === filters.brand)?.models || []).map(m => m.name);
  const trims = (brands.find(b => b.brand === filters.brand)?.models?.find(m => m.name === filters.model)?.trims || []);
  const districts = (cities.find(c => c.city === filters.city)?.districts || []);

  const handleApply = useCallback(() => {
    const params = createSearchParamsFromListingFilters({ ...filters, page: 1 });
    router.push(`/listings?${params.toString()}`);
  }, [filters, router]);

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      const params = createSearchParamsFromListingFilters({
        ...deferredFilters,
        limit: 1,
        page: 1,
      });

      setIsCounting(true);

      try {
        const response = await fetch(`/api/listings?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: {
            total?: number;
          };
        };

        if (typeof payload.data?.total === "number") {
          setResultCount(payload.data.total);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          // ignore
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCounting(false);
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [deferredFilters]);

  const SECTIONS: { id: FilterSection; label: string; icon: React.ReactNode }[] = [
    { id: "brand", label: "Temel Bilgiler", icon: <Car size={16} /> },
    { id: "price", label: "Fiyat & KM", icon: <Gauge size={16} /> },
    { id: "year", label: "Model Yılı", icon: <SlidersHorizontal size={16} /> },
    { id: "location", label: "Konum", icon: <MapPin size={16} /> },
    { id: "technical", label: "Teknik", icon: <Zap size={16} /> },
    { id: "trust", label: "Ekspertiz", icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-card border border-gray-200 rounded-xl overflow-hidden sticky top-24 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition",
                      activeSection === section.id
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-card border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              <Link href="/listings" className="flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-card text-gray-500 hover:text-blue-500 transition">
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Gelişmiş Filtreleme</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetFilters} className="flex items-center gap-2 bg-card border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                <RotateCcw size={14} />
                Sıfırla
              </button>
              <SaveSearchButton filters={filters} resultCount={resultCount} userId={userId} />
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition shadow-md disabled:opacity-70"
              >
                <Search size={14} />
                {isPending ? "Yükleniyor..." : `Sonuçları Gör (${resultCount.toLocaleString("tr-TR")} ilan)`}
              </button>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mb-6 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
              <SlidersHorizontal size={14} />
              <span className="font-medium">{activeCount} filtre aktif</span>
              <button onClick={resetFilters} className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600">
                Tümünü Temizle
              </button>
            </div>
          )}

          {activeSection === "brand" && (
            <section className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Marka</label>
                  <select
                    value={filters.brand ?? ""}
                    onChange={(e) => updateFilter("brand", e.target.value || undefined)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-card"
                  >
                    <option value="">Seçiniz...</option>
                    {brands.map(b => <option key={b.brand} value={b.brand}>{b.brand}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Model</label>
                  <select
                    value={filters.model ?? ""}
                    onChange={(e) => updateFilter("model", e.target.value || undefined)}
                    disabled={!filters.brand}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-50 outline-none bg-card"
                  >
                    <option value="">Seçiniz...</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Paket</label>
                  <select
                    value={filters.carTrim ?? ""}
                    onChange={(e) => updateFilter("carTrim", e.target.value || undefined)}
                    disabled={!filters.model}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-50 outline-none bg-card"
                  >
                    <option value="">Seçiniz...</option>
                    {trims.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </section>
          )}

          {activeSection === "price" && (
            <section className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RangeInput
                  label="Fiyat Aralığı"
                  unit="TL"
                  minValue={filters.minPrice}
                  maxValue={filters.maxPrice}
                  minPlaceholder="100.000"
                  maxPlaceholder="10.000.000"
                  onMinChange={(v) => updateFilter("minPrice", v)}
                  onMaxChange={(v) => updateFilter("maxPrice", v)}
                />
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Maksimum KM</label>
                  <input
                    type="number"
                    value={filters.maxMileage ?? ""}
                    onChange={(e) => updateFilter("maxMileage", e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-card"
                  />
                </div>
              </div>
            </section>
          )}

          {activeSection === "year" && (
            <section>
              <RangeInput
                label="Model Yılı"
                unit="Yıl"
                minValue={filters.minYear}
                maxValue={filters.maxYear}
                minPlaceholder="1990"
                maxPlaceholder={String(CURRENT_YEAR)}
                onMinChange={(v) => updateFilter("minYear", v)}
                onMaxChange={(v) => updateFilter("maxYear", v)}
              />
            </section>
          )}

          {activeSection === "location" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Şehir</label>
                <select
                  value={filters.city ?? ""}
                  onChange={(e) => updateFilter("city", e.target.value || undefined)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-card"
                >
                  <option value="">Tüm Şehirler</option>
                  {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">İlçe</label>
                <select
                  value={filters.district ?? ""}
                  onChange={(e) => updateFilter("district", e.target.value || undefined)}
                  disabled={!filters.city}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm disabled:bg-gray-50 outline-none bg-card"
                >
                  <option value="">Tüm İlçeler</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </section>
          )}

          {activeSection === "technical" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3">Yakıt Tipi</label>
                <div className="space-y-2">
                  {FUEL_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={filters.fuelType === opt.value}
                        onChange={() => updateFilter("fuelType", filters.fuelType === opt.value ? undefined : opt.value as ListingFilters["fuelType"])}
                        className="rounded border-gray-300 text-blue-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3">Vites Tipi</label>
                <div className="space-y-2">
                  {TRANSMISSION_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={filters.transmission === opt.value}
                        onChange={() => updateFilter("transmission", filters.transmission === opt.value ? undefined : opt.value)}
                        className="rounded border-gray-300 text-blue-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSection === "trust" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={filters.hasExpertReport === true}
                  onChange={() => updateFilter("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                  className="rounded border-gray-300 text-blue-500"
                />
                Ekspertiz raporlu ilanlar
              </label>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Maks. Tramer (TL)</label>
                <input
                  type="number"
                  value={filters.maxTramer ?? ""}
                  onChange={(e) => updateFilter("maxTramer", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-card"
                />
              </div>
            </section>
          )}

          <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-800">{isCounting ? "..." : resultCount}</span> ilan bulundu
            </p>
            <button
              onClick={handleApply}
              disabled={isPending}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-70"
            >
              {isPending ? "Yükleniyor..." : "Sonuçları Gör"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function RangeInput({
  label,
  unit,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (v: number | undefined) => void;
  onMaxChange: (v: number | undefined) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/10">
      <div className="flex justify-between items-center mb-4">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] text-gray-400 font-bold uppercase">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={minValue ?? ""}
          onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center outline-none bg-card"
        />
        <span className="text-gray-300">—</span>
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue ?? ""}
          onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center outline-none bg-card"
        />
      </div>
    </div>
  );
}
