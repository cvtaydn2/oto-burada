import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Fuel,
  Gauge,
  MapPinned,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
} from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import type { Listing } from "@/types";

interface HomeAiHeroProps {
  averagePrice: number;
  brandCatalog: Array<{ brand: string }>;
  budgetFriendlyCount: number;
  cityCoverageCount: number;
  cityOptions: Array<{ city: string }>;
  lowMileageCount: number;
  postListingHref: string;
  quickFilters: Array<{ href: string; label: string }>;
  spotlightListing: Listing;
}

export function HomeAiHero({
  averagePrice,
  brandCatalog,
  budgetFriendlyCount,
  cityCoverageCount,
  cityOptions,
  lowMileageCount,
  postListingHref,
  quickFilters,
  spotlightListing,
}: HomeAiHeroProps) {
  const spotlightImage =
    spotlightListing.images.find((image) => image.isCover) ?? spotlightListing.images[0];
  const spotlightInsight = getListingCardInsights(spotlightListing);
  const marketSummary = [
    {
      helper: "Butce dostu fiyat bandinda hizli eleme icin one cikiyor.",
      label: "iyi fiyat sinyali",
      value: `${budgetFriendlyCount} ilan`,
    },
    {
      helper: "Kilometre hassasiyeti olan aramalar icin hazir havuz.",
      label: "dusuk km",
      value: `${lowMileageCount} ilan`,
    },
    {
      helper: "Ana akista aktif gorunen sehir cesitliligi.",
      label: "sehir kapsami",
      value: `${cityCoverageCount} sehir`,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-primary/10 bg-gradient-to-br from-white via-white to-primary/10 p-4 shadow-sm sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <SlidersHorizontal className="size-4 text-primary" />
                Akilli baslangic
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                3 adim
              </span>
            </div>

            <form action="/listings" className="space-y-6 p-5">
              <label className="block space-y-2 text-sm font-medium text-slate-900">
                <span>Kelime ile ara</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="query"
                    placeholder="Marka, model, paket..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>
              </label>

              <div className="grid gap-4">
                <label className="block space-y-2 text-sm font-medium text-slate-900">
                  <span>Sehir</span>
                  <select
                    name="city"
                    defaultValue=""
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Tum sehirler</option>
                    {cityOptions.map((item) => (
                      <option key={item.city} value={item.city}>
                        {item.city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 text-sm font-medium text-slate-900">
                  <span>Marka</span>
                  <select
                    name="brand"
                    defaultValue=""
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Tum markalar</option>
                    {brandCatalog.map((item) => (
                      <option key={item.brand} value={item.brand}>
                        {item.brand}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 text-sm font-medium text-slate-900">
                  <span>Maksimum fiyat</span>
                  <input
                    type="number"
                    name="maxPrice"
                    min="0"
                    placeholder="Orn. 1200000"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="size-4 text-primary" />
                  Hemen sec
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((filter) => (
                    <Link
                      key={filter.label}
                      href={filter.href}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-white"
                    >
                      {filter.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sonuclari goster
                </button>
                <Link
                  href={postListingHref}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                >
                  Ilan ver
                </Link>
              </div>
            </form>
          </aside>

          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="size-3.5" />
                  Google AI Studio yonu
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  Ucretsiz bireysel araba ilanlari
                </span>
              </div>

              <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                    Arabanı kolayca sat. Doğru arabayı daha az tıklamayla bul.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    Oto Burada, AI Studio taslağındaki güçlü karar katmanını mevcut marketplace
                    akışına taşıyor. Amaç net: filtreyi hızlı kur, kartı hızlı oku, satıcıya
                    güvenli biçimde geç.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/listings"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Ilanlari incele
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="#neden-oto-burada"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Guven notlari
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {marketSummary.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                          {item.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.helper}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <TrendingDown className="size-4 text-primary" />
                    Pazar ozeti
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                    {formatCurrency(averagePrice)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Canli akistaki genel fiyat ortalamasi. Butce filtresi ve dusuk km kisayollari
                    ile ilk karar daha hizli veriliyor.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        Hemen taranabilir
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {budgetFriendlyCount} butce dostu ilan, {lowMileageCount} dusuk km secenek
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                        Sehir dagilimi
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {cityCoverageCount} sehirde aktif ilan gorunuyor.
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Neden farkli?
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        Kart ustunde karar sinyali, detayda net CTA ve moderasyon guvencesi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Spotlight ilan</p>
                    <p className="mt-1 text-sm text-slate-500">
                      AI Studio draft’indeki ana kart diliyle one cikan bir ilan onizlemesi.
                    </p>
                  </div>
                  <Link
                    href={`/listing/${spotlightListing.slug}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    Detaya git
                    <ArrowRight className="size-4" />
                  </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <div className="relative h-64 overflow-hidden rounded-[1.5rem] bg-slate-100">
                    <Image
                      src={spotlightImage.url}
                      alt={spotlightListing.title}
                      fill
                      sizes="(min-width: 1024px) 340px, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white">
                      <span className="rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        {spotlightInsight.badgeLabel}
                      </span>
                      <span className="rounded-full border border-white/20 bg-slate-950/35 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        {spotlightListing.images.length} fotograf
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                          {spotlightListing.title}
                        </h2>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <MapPinned className="size-4 text-primary" />
                          {spotlightListing.city} / {spotlightListing.district}
                        </p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">
                          {formatCurrency(spotlightListing.price)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">One cikan karar karti</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        <Gauge className="size-4 text-slate-400" />
                        {spotlightListing.mileage.toLocaleString("tr-TR")} km
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        <Fuel className="size-4 text-slate-400" />
                        {spotlightListing.fuelType}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        <Settings2 className="size-4 text-slate-400" />
                        {spotlightListing.transmission}
                      </span>
                    </div>

                    <div className="rounded-[1.25rem] border border-primary/10 bg-gradient-to-r from-primary/10 to-background p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Sparkles className="size-4" />
                        Hizli degerlendirme
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {spotlightInsight.summary}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {spotlightInsight.highlights.map((highlight) => (
                          <div
                            key={`${spotlightListing.id}-${highlight}`}
                            className="flex items-start gap-2 text-sm text-slate-700"
                          >
                            <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-primary" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
