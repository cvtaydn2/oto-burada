import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { ListingCard } from "@/components/listings/listing-card";
import { HomeMarketInsights } from "@/components/shared/home-market-insights";
import { SectionHeader } from "@/components/shared/section-header";
import { brandCatalog, cityOptions, exampleListings, featuredListings, latestListings } from "@/data";
import { getCurrentUser } from "@/lib/auth/session";
import { buildAbsoluteUrl } from "@/lib/seo";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ucretsiz araba ilanlari",
  description:
    "Sadece arabalar icin tasarlanmis, mobil odakli ve guven veren sade ikinci el araba ilan platformu.",
  alternates: {
    canonical: buildAbsoluteUrl("/"),
  },
  openGraph: {
    description:
      "Sadece arabalar icin tasarlanmis, mobil odakli ve guven veren sade ikinci el araba ilan platformu.",
    title: "Ucretsiz araba ilanlari | Oto Burada",
    url: buildAbsoluteUrl("/"),
  },
};

const trustHighlights = [
  {
    title: "Sadece araba ilanları",
    description: "Daha sade gezinme ve daha hızlı filtreleme için ürün odağını net tutuyoruz.",
    icon: CarFront,
  },
  {
    title: "Güven odaklı deneyim",
    description: "Moderasyon, net bilgi hiyerarşisi ve şüpheli ilan bildirme akışı merkezdedir.",
    icon: ShieldCheck,
  },
  {
    title: "Mobilde hızlı kullanım",
    description: "Karmaşayı azaltan bileşenler ve büyük dokunma alanları ile akışlar kolay ilerler.",
    icon: BadgeCheck,
  },
];

const quickFilters = [
  { label: "Otomatik Vites", href: "/listings?transmission=otomatik" },
  { label: "Düşük KM", href: "/listings?maxMileage=80000" },
  { label: "İstanbul", href: "/listings?city=%C4%B0stanbul" },
  { label: "1.000.000 TL Altı", href: "/listings?maxPrice=1000000" },
];

const journeySteps = [
  {
    id: "search",
    title: "İhtiyacını seç",
    description: "Marka, şehir veya bütçe ile üç alan içinde ilk sonucu daralt.",
  },
  {
    id: "compare",
    title: "Kartları kıyasla",
    description: "Kilometre, vites ve fiyat özetleriyle ilanları hızlıca ele.",
  },
  {
    id: "contact",
    title: "Satıcıya geç",
    description: "Uygun ilanı WhatsApp ile doğrudan satıcıya bağlanarak ilerlet.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const postListingHref = user ? "/dashboard/listings" : "/login";
  const averagePrice = Math.round(
    exampleListings.reduce((total, listing) => total + listing.price, 0) / exampleListings.length,
  );
  const budgetFriendlyCount = exampleListings.filter((listing) => listing.price <= 1_000_000).length;
  const easyDriveCount = exampleListings.filter((listing) =>
    ["otomatik", "yari_otomatik"].includes(listing.transmission),
  ).length;
  const cityCoverageCount = new Set(exampleListings.map((listing) => listing.city)).size;
  const marketSummary = [
    {
      label: "Ortalama fiyat",
      value: formatCurrency(averagePrice),
      helper: "Canlı seed ilan akışındaki genel fiyat bandını özetler.",
      toneClassName: "sm:col-span-2",
    },
    {
      label: "Bütçe dostu",
      value: `${budgetFriendlyCount} ilan`,
      helper: "1.000.000 TL altındaki araçları hızlı giriş için öne çıkarır.",
      toneClassName: "bg-emerald-50/70",
    },
    {
      label: "Kolay sürüş",
      value: `${easyDriveCount} ilan`,
      helper: "Otomatik ve yarı otomatik seçenekleri ilk bakışta ayırır.",
      toneClassName: "bg-sky-50/80",
    },
    {
      label: "Şehir kapsaması",
      value: `${cityCoverageCount} şehir`,
      helper: "İlan akışındaki aktif şehir dağılımını tek kartta gösterir.",
      toneClassName: "bg-amber-50/80",
    },
  ];

  return (
    <main className="bg-muted/40">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Ücretsiz bireysel araba ilanları
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                Sade, güvenli ve mobil odaklı
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Arabanı kolayca sat. Doğru arabayı hızlıca bul.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Oto Burada, sadece arabalar için tasarlanmış sade ve güvenilir bir pazaryeri
                deneyimi sunar. Gereksiz karmaşayı azaltır, doğru ilana daha hızlı ulaşmanı sağlar.
              </p>
            </div>

            <form
              action="/listings"
              className="rounded-[2rem] border border-border/80 bg-background p-4 shadow-sm sm:p-5"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Marka veya model</span>
                  <input
                    type="text"
                    name="query"
                    placeholder="Marka, model ara..."
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Şehir</span>
                  <select
                    name="city"
                    defaultValue=""
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Tüm şehirler</option>
                    {cityOptions.map((item) => (
                      <option key={item.city} value={item.city}>
                        {item.city}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Marka</span>
                  <select
                    name="brand"
                    defaultValue=""
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Tüm markalar</option>
                    {brandCatalog.map((item) => (
                      <option key={item.brand} value={item.brand}>
                        {item.brand}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Maksimum fiyat</span>
                  <input
                    type="number"
                    name="maxPrice"
                    min="0"
                    placeholder="Örn. 1200000"
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Uygun İlanları Bul
                </button>
                <Link
                  href={postListingHref}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  İlan Ver
                </Link>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Link
                  key={filter.label}
                  href={filter.href}
                  className="rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/listings"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                İlanları İncele
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#neden-oto-burada"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Neden Oto Burada?
              </Link>
            </div>
          </div>

          <HomeMarketInsights summaryItems={marketSummary} steps={journeySteps} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary/80">
              Akıllı başlangıç
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              İlk filtreler daha karar verdirici
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              AI Studio ve Figma taslaklarından uyarlanan kısa yollar sayesinde bütçe, şehir ve
              vites odağını ilk ekranda netleştiriyoruz.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <SlidersHorizontal className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Hızlı eleme
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              İlan kartı karar için yeterli olsun
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Fiyat, kilometre, yakıt ve şehir verisini kart üzerinde görünür tutarak gereksiz
              detay sayfası ziyaretlerini azaltıyoruz.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <MapPinned className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
              Güvenli temas
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Satıcıya geçiş daha net
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Moderasyon, raporlama ve doğrudan WhatsApp teması birlikte çalışarak daha kontrollü
              bir ilk iletişim akışı kuruyor.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          title="Öne çıkan ilanlar"
          description="Daha hızlı karar vermen için öne çıkan araçları tek bakışta gör."
          actionHref="/listings"
          actionLabel="Tüm ilanları gör"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredListings.slice(0, 6).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            title="Yeni ilanlar"
            description="Platforma yeni eklenen ilanları hızlıca tarayabilmen için güncel akış."
            actionHref="/listings"
            actionLabel="Hepsini incele"
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {latestListings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="neden-oto-burada"
        className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <SectionHeader
          title="Güven veren sade deneyim"
          description="Kalabalık ilan siteleri yerine, güven ve hız odaklı net bir akış sunuyoruz."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {trustHighlights.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5 shadow-sm"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
