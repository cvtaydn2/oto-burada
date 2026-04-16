"use client";

import { useState, useCallback, useTransition, useEffect, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RotateCcw, Save, Search,
  SlidersHorizontal, MapPin, Gauge, Car, Zap, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingFilters, BrandCatalogItem, CityOption } from "@/types";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { useAuthUser } from "@/components/shared/auth-provider";

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

const POPULAR_CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya"];
const CURRENT_YEAR = new Date().getFullYear();

type FilterSection = "brand" | "price" | "year" | "location" | "technical" | "trust";

export function AdvancedFilterPage({
  brands,
  cities,
  initialFilters,
  totalCount,
}: AdvancedFilterPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [activeSection, setActiveSection] = useState<FilterSection>("brand");
  const [resultCount, setResultCount] = useState(totalCount);
  const [isCounting, setIsCounting] = useState(false);
  const deferredFilters = useDeferredValue(filters);
  const { userId } = useAuthUser();

  const models = (brands.find(b => b.brand === filters.brand)?.models || []).map(m => m.name);
  const trims = (brands.find(b => b.brand === filters.brand)?.models?.find(m => m.name === filters.model)?.trims || []);
  const districts = (cities.find(c => c.city === filters.city)?.districts || []);

  const updateFilter = useCallback(<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ sort: "newest" });
  }, []);

  const handleApply = useCallback(() => {
    startTransition(() => {
      const params = createSearchParamsFromListingFilters({ ...filters, page: 1 });
      router.push(`/listings?${params.toString()}`);
    });
  }, [filters, router]);

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (["limit", "offset", "sort", "page"].includes(key)) return false;
    return val !== undefined && val !== "";
  }).length;

  useEffect(() => {
    const controller = new AbortController();
    const params = createSearchParamsFromListingFilters({
      ...deferredFilters,
      limit: 1,
      page: 1,
    });

    const loadResultCount = async () => {
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
          console.error("Advanced filter count fetch failed", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCounting(false);
        }
      }
    };

    void loadResultCount();

    return () => {
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

        {/* Sol Sidebar — Kategori Navigasyonu */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-24 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Kategoriler</p>
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
                    {activeSection === section.id && (
                      <svg className="ml-auto size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Hızlı Filtreler</p>
              <div className="space-y-2.5 px-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={filters.hasExpertReport === true}
                    onChange={() => updateFilter("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
                  />
                  <span className="text-gray-700">Ekspertizli Araçlar</span>
                </label>
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                <Search size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-800">Akıllı Arama</p>
                  <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">Seçtiğiniz kriterlere en yakın sonuçlar önceliklendirilir.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Ana İçerik */}
        <main className="flex-1 bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/listings"
                className="flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-500 hover:border-blue-200 transition"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Gelişmiş Filtreleme</h1>
                <p className="text-sm text-gray-500 mt-0.5">İstediğiniz aracı bulmak için detaylı kriterleri belirleyin.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                <RotateCcw size={14} />
                Sıfırla
              </button>
              <div className="flex items-center gap-2">
                <Save size={14} className="text-gray-500" />
                <SaveSearchButton filters={filters} resultCount={resultCount} userId={userId} />
              </div>
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition shadow-md disabled:opacity-70"
              >
                <Search size={14} />
                {isPending ? "Yükleniyor..." : isCounting ? "İlanlar hesaplanıyor..." : `Sonuçları Gör (${resultCount.toLocaleString("tr-TR")} ilan)`}
              </button>
            </div>
          </div>

          {/* Aktif filtre sayısı */}
          {activeCount > 0 && (
            <div className="mb-6 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
              <SlidersHorizontal size={14} />
              <span className="font-medium">{activeCount} filtre aktif</span>
              <button onClick={handleReset} className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600">
                Tümünü Temizle
              </button>
            </div>
          )}

          {/* Marka & Model */}
          {activeSection === "brand" && (
            <section className="space-y-8">
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-1">Marka ve Model</h2>
                <p className="text-xs text-gray-500 mb-5">Aradığınız aracın marka ve model hiyerarşisini belirleyin.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Marka</label>
                    <select
                      value={filters.brand ?? ""}
                      onChange={(e) => {
                        updateFilter("brand", e.target.value || undefined);
                        updateFilter("model", undefined);
                        updateFilter("carTrim", undefined);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Örn: BMW, Mercedes, Toyota...</option>
                      {brands.map(b => <option key={b.brand} value={b.brand}>{b.brand}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Seri / Model</label>
                    <select
                      value={filters.model ?? ""}
                      onChange={(e) => {
                        updateFilter("model", e.target.value || undefined);
                        updateFilter("carTrim", undefined);
                      }}
                      disabled={!filters.brand}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Örn: 3 Serisi, C Serisi...</option>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Paket</label>
                    <select
                      value={filters.carTrim ?? ""}
                      onChange={(e) => updateFilter("carTrim", e.target.value || undefined)}
                      disabled={!filters.model}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Örn: M Sport, AMG, Vision...</option>
                      {trims.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Fiyat & KM */}
          {activeSection === "price" && (
            <section className="space-y-8">
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-5">Fiyat ve Kilometre</h2>
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
                    <label className="block text-sm font-bold text-gray-700 mb-3">Kilometre</label>
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                      <input
                        type="number"
                        placeholder="Maks. Kilometre"
                        value={filters.maxMileage ?? ""}
                        onChange={(e) => updateFilter("maxMileage", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white mb-3"
                      />
                      <div className="flex flex-wrap gap-2">
                        {[50000, 100000, 150000, 200000, 300000].map((km) => (
                          <button
                            key={km}
                            onClick={() => updateFilter("maxMileage", filters.maxMileage === km ? undefined : km)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                              filters.maxMileage === km
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                            )}
                          >
                            {km >= 1000 ? `${km / 1000}K km` : `${km} km`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Model Yılı */}
          {activeSection === "year" && (
            <section>
              <h2 className="text-base font-bold text-gray-800 mb-5">Model Yılı</h2>
              <RangeInput
                label="Yıl Aralığı"
                unit="Yıl"
                minValue={filters.minYear}
                maxValue={filters.maxYear}
                minPlaceholder="1990"
                maxPlaceholder={String(CURRENT_YEAR)}
                onMinChange={(v) => updateFilter("minYear", v)}
                onMaxChange={(v) => updateFilter("maxYear", v)}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {[2020, 2021, 2022, 2023, 2024].map((year) => (
                  <button
                    key={year}
                    onClick={() => updateFilter("minYear", filters.minYear === year ? undefined : year)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition",
                      filters.minYear === year
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    )}
                  >
                    {year}+
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Konum */}
          {activeSection === "location" && (
            <section className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-5">Konum</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3">Şehir</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {POPULAR_CITIES.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            updateFilter("city", filters.city === city ? undefined : city);
                            updateFilter("district", undefined);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition",
                            filters.city === city
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                      <select
                        value={filters.city && !POPULAR_CITIES.includes(filters.city) ? filters.city : ""}
                        onChange={(e) => {
                          updateFilter("city", e.target.value || undefined);
                          updateFilter("district", undefined);
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 bg-white hover:border-blue-300 outline-none cursor-pointer"
                      >
                        <option value="">+ Diğer</option>
                        {cities
                          .filter(c => !POPULAR_CITIES.includes(c.city))
                          .map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">İlçe</label>
                    <select
                      value={filters.district ?? ""}
                      onChange={(e) => updateFilter("district", e.target.value || undefined)}
                      disabled={!filters.city}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Tüm İlçeler</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Teknik */}
          {activeSection === "technical" && (
            <section className="space-y-8">
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-5">Teknik Özellikler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3">Yakıt Tipi</label>
                    <div className="space-y-2.5">
                      {FUEL_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-sm group">
                          <input
                            type="checkbox"
                            checked={filters.fuelType === opt.value}
                            onChange={() => updateFilter("fuelType", filters.fuelType === opt.value ? undefined : opt.value as ListingFilters["fuelType"])}
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
                          />
                          <span className={cn(
                            "transition-colors",
                            filters.fuelType === opt.value ? "font-bold text-blue-600" : "text-gray-700 group-hover:text-gray-900"
                          )}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3">Vites Tipi</label>
                    <div className="space-y-2.5">
                      {TRANSMISSION_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-sm group">
                          <input
                            type="checkbox"
                            checked={filters.transmission === opt.value}
                            onChange={() => updateFilter("transmission", filters.transmission === opt.value ? undefined : opt.value)}
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
                          />
                          <span className={cn(
                            "transition-colors",
                            filters.transmission === opt.value ? "font-bold text-blue-600" : "text-gray-700 group-hover:text-gray-900"
                          )}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Ekspertiz */}
          {activeSection === "trust" && (
            <section className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-5">Ekspertiz & Hasar Durumu</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm group">
                      <input
                        type="checkbox"
                        checked={filters.hasExpertReport === true}
                        onChange={() => updateFilter("hasExpertReport", filters.hasExpertReport ? undefined : true)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 size-4"
                      />
                      <span className={cn(
                        "transition-colors",
                        filters.hasExpertReport ? "font-bold text-blue-600" : "text-gray-700 group-hover:text-gray-900"
                      )}>
                        Ekspertiz raporlu ilanlar
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">Maks. Tramer Tutarı (TL)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Örn: 50000"
                      value={filters.maxTramer ?? ""}
                      onChange={(e) => updateFilter("maxTramer", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">0 girerek hasarsız araçları filtreleyin</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Alt CTA */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              Seçilen kriterlere göre{" "}
              <span className="font-bold text-gray-800">
                {isCounting ? "..." : resultCount.toLocaleString("tr-TR")}
              </span>{" "}
              ilan bulundu
            </p>
            <button
              onClick={handleApply}
              disabled={isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 disabled:opacity-70"
            >
              <Search size={16} />
              {isPending ? "Yükleniyor..." : "Sonuçları Gör"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── RangeInput ───────────────────────────────────────────────────────────────

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
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <span className="text-xs text-gray-400 font-medium">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={minValue ?? ""}
          onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:border-blue-500 outline-none bg-white"
        />
        <span className="text-gray-400 text-sm">—</span>
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue ?? ""}
          onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:border-blue-500 outline-none bg-white"
        />
      </div>
    </div>
  );
}
