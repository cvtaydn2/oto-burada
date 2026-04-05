"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Filter,
  Fuel,
  Gauge,
  MapPin,
  Scale,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import {
  aiStudioDraftListings,
  type AiStudioDraftListing,
} from "@/data/ai-studio-draft-listings";

function DraftSkeletonCard() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="h-64 w-full animate-pulse rounded-[1.25rem] bg-slate-100 md:w-[340px]" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="flex gap-3">
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="h-24 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function DraftListingCard({
  car,
  isSelected,
  onToggleCompare,
}: {
  car: AiStudioDraftListing;
  isSelected: boolean;
  onToggleCompare: (id: string) => void;
}) {
  const isPremium = car.listingQualityScore >= 90;

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        car.isSuspicious
          ? "border-red-300"
          : isPremium
            ? "border-indigo-200"
            : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleCompare(car.id)}
        className="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md"
        aria-label="Karsilastirma listesine ekle"
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
        />
      </button>

      <div className="flex flex-col md:flex-row">
        <div className="relative h-64 w-full flex-shrink-0 overflow-hidden bg-slate-100 md:w-[340px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={car.thumbnail}
            alt={car.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
            {car.marketStatus === "excellent" ? (
              <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                <TrendingDown className="size-3.5" />
                IYI FIYAT
              </div>
            ) : null}

            {car.marketStatus === "high" ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                <TrendingUp className="size-3.5" />
                YUKSEK FIYAT
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                1/{car.images.length + 1} Fotograf
              </div>
              {isPremium ? (
                <div className="flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <Sparkles className="size-3" />
                  Premium
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="mb-3">
                <h2 className="truncate text-xl font-semibold text-slate-900 transition-colors hover:text-indigo-600">
                  {car.brand} {car.series}{" "}
                  <span className="font-normal text-slate-500">{car.model}</span>
                </h2>
                <p className="mt-1 line-clamp-1 text-base text-slate-600">{car.title}</p>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Calendar className="size-4 text-slate-400" />
                  {car.year}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Gauge className="size-4 text-slate-400" />
                  {car.km.toLocaleString("tr-TR")} km
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Fuel className="size-4 text-slate-400" />
                  {car.fuel}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Settings2 className="size-4 text-slate-400" />
                  {car.gear}
                </div>
              </div>

              {!car.isSuspicious && car.insights.length > 0 ? (
                <div className="rounded-xl border border-indigo-100/50 bg-gradient-to-r from-indigo-50 to-blue-50/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900">
                      Yapay Zeka Analizi
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {car.insights.slice(0, 2).map((insight) => (
                      <div
                        key={`${car.id}-${insight}`}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-indigo-500" />
                        <span className="line-clamp-1">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {car.isSuspicious ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Supheli ilan uyarisi: fiyat piyasa ortalamasinin cok altinda. Kapora gondermeyin.
                </div>
              ) : null}
            </div>

            <div className="w-full flex-shrink-0 border-t border-slate-100 pt-4 lg:w-48 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="mb-4 w-full text-left lg:text-right">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {car.price.toLocaleString("tr-TR")}{" "}
                  <span className="text-lg font-medium text-slate-500">{car.currency}</span>
                </div>

                {car.marketStatus === "excellent" ? (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-600">
                    <TrendingDown className="size-4" />
                    {Math.abs(car.priceDiff).toLocaleString("tr-TR")} TL Avantaj
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="size-4 text-slate-400" />
                  <span className="truncate">{car.location}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {car.seller.name.charAt(0)}
                  </div>
                  <span className="flex-1 truncate">{car.seller.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/listing/${car.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Taslagi Incele
            </Link>
            <Link
              href="/dashboard/listings"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Bu dili dashboard&apos;a tasi
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AiStudioDraftHome() {
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleCompare = (id: string) => {
    setSelectedCompare((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 3),
    );
  };

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedQuery) {
      return aiStudioDraftListings;
    }

    return aiStudioDraftListings.filter((car) =>
      [car.brand, car.series, car.model, car.title, car.location]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery),
    );
  }, [query]);

  const compareCars = aiStudioDraftListings.filter((car) => selectedCompare.includes(car.id));
  const excellentDealsCount = aiStudioDraftListings.filter(
    (car) => car.marketStatus === "excellent",
  ).length;

  return (
    <div className="bg-[#f5f7fb]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">
            AI Studio Draft
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Google AI Studio export taslagi mevcut Next.js yapisina preview olarak aktarıldı
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Bu sayfa mevcut uygulamayi bozmadan AI Studio&apos;dan gelen landing/listing dilini
            ayni repo icinde test etmek icin ayrildi. Uygun buldugun bloklari sonra ana sayfa,
            listings veya dashboard tarafina parcali tasiyabiliriz.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Mevcut ana sayfaya don
            </Link>
            <Link
              href="/listings"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Canli listings sayfasini ac
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-14 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full lg:w-[280px] lg:flex-shrink-0">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <SlidersHorizontal className="size-4 text-indigo-600" />
                Filtreler
              </div>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Temizle
              </button>
            </div>

            <div className="space-y-8 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Kelime ile ara..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <Sparkles className="size-4 text-indigo-600" />
                  Akilli Secimler
                </h3>
                <div className="space-y-3">
                  {[
                    `Fiyati Dusenler`,
                    `Iyi Fiyatli Araclar (${excellentDealsCount})`,
                    `Onayli Saticilar`,
                  ].map((label) => (
                    <label
                      key={label}
                      className="flex cursor-pointer items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h3 className="mb-4 font-semibold text-slate-900">Fiyat Araligi</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Sonuclari Goster
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Otomobil Ilanlari
                </h2>
                <p className="mt-2 text-base text-slate-500">
                  Turkiye genelinde{" "}
                  <span className="font-semibold text-slate-900">{filteredListings.length}</span>{" "}
                  arac bulundu.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                <Filter className="size-4 text-indigo-600" />
                Akilli siralama onizlemesi
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[1.5rem] border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <Sparkles className="size-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-indigo-900">Yapay Zeka Ozeti</h3>
                <p className="text-sm leading-6 text-indigo-900/80">
                  Bu taslakta arama sonuclarinin yanina AI destekli fiyat yorumu, karsilastirma
                  akisi ve guven sinyalleri ekleniyor. En dikkat cekici parca, listing kartlarinin
                  icinde ikinci bir karar katmani sunmasi.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 pb-24">
            {isLoading
              ? Array.from({ length: 4 }, (_, index) => <DraftSkeletonCard key={index} />)
              : filteredListings.map((car) => (
                  <DraftListingCard
                    key={car.id}
                    car={car}
                    isSelected={selectedCompare.includes(car.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
          </div>

          {!isLoading ? (
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-400"
                  disabled
                >
                  Onceki
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                  2
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
                >
                  Sonraki
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {selectedCompare.length > 0 ? (
        <div className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-6 rounded-[1.5rem] border border-slate-700 bg-slate-900 px-6 py-4 text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 font-semibold">
              {selectedCompare.length}
            </div>
            <span className="whitespace-nowrap font-medium">Arac Secildi</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-indigo-50"
            >
              <Scale className="size-4" />
              Karsilastir
            </button>
            <button
              type="button"
              onClick={() => setSelectedCompare([])}
              className="p-2 text-slate-400 transition-colors hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      {showCompareModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <h3 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <Scale className="text-indigo-600" />
                Akilli Karsilastirma
              </h3>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="overflow-x-auto p-6">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-48 border-b border-slate-200 p-4" />
                    {compareCars.map((car) => (
                      <th
                        key={car.id}
                        className="min-w-[250px] border-b border-slate-200 p-4 align-top"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={car.thumbnail}
                          alt={car.title}
                          className="mb-3 h-32 w-full rounded-xl object-cover"
                        />
                        <div className="font-semibold text-slate-900">
                          {car.brand} {car.series}
                        </div>
                        <div className="text-sm font-normal text-slate-500">{car.model}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-4 font-medium text-slate-500">Fiyat</td>
                    {compareCars.map((car) => {
                      const isLowest = car.price === Math.min(...compareCars.map((item) => item.price));

                      return (
                        <td key={car.id} className="p-4">
                          <div className={`text-xl font-semibold ${isLowest ? "text-green-600" : "text-slate-900"}`}>
                            {car.price.toLocaleString("tr-TR")} {car.currency}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-500">Kilometre</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="p-4 font-medium text-slate-900">
                        {car.km.toLocaleString("tr-TR")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-500">Yapay Zeka Ozeti</td>
                    {compareCars.map((car) => (
                      <td key={car.id} className="p-4">
                        <ul className="space-y-1">
                          {car.insights.map((insight) => (
                            <li
                              key={`${car.id}-${insight}`}
                              className="flex items-start gap-1.5 text-sm text-slate-700"
                            >
                              <CheckCircle2 className="mt-0.5 size-3.5 flex-shrink-0 text-indigo-500" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
