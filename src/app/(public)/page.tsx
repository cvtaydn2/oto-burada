import type { Metadata } from "next";
import {
  BadgeCheck,
  CarFront,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { HomeAiHero } from "@/components/shared/home-ai-hero";
import { ListingCard } from "@/components/listings/listing-card";
import { SectionHeader } from "@/components/shared/section-header";
import { brandCatalog, cityOptions, exampleListings, featuredListings, latestListings } from "@/data";
import { getCurrentUser } from "@/lib/auth/session";
import { buildAbsoluteUrl } from "@/lib/seo";

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

export default async function HomePage() {
  const user = await getCurrentUser();
  const postListingHref = user ? "/dashboard/listings" : "/login";
  const spotlightListing = featuredListings[0] ?? latestListings[0];
  const averagePrice = Math.round(
    exampleListings.reduce((total, listing) => total + listing.price, 0) / exampleListings.length,
  );
  const budgetFriendlyCount = exampleListings.filter((listing) => listing.price <= 1_000_000).length;
  const lowMileageCount = exampleListings.filter((listing) => listing.mileage <= 80_000).length;
  const cityCoverageCount = new Set(exampleListings.map((listing) => listing.city)).size;

  return (
    <main className="bg-[#f5f7fb]">
      <HomeAiHero
        averagePrice={averagePrice}
        brandCatalog={brandCatalog}
        budgetFriendlyCount={budgetFriendlyCount}
        cityCoverageCount={cityCoverageCount}
        cityOptions={cityOptions}
        lowMileageCount={lowMileageCount}
        postListingHref={postListingHref}
        quickFilters={quickFilters}
        spotlightListing={spotlightListing}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary/80">
              Akıllı başlangıç
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Ilk filtreler daha karar verdirici
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              AI Studio taslagindaki filtre paneli mantigini ana sayfaya tasiyip ilk aramayi daha
              yonlendirici hale getirdik.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <SlidersHorizontal className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Hızlı eleme
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Spotlight ilan ile karar mantigi gorunur
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ornek kartin ustune cikarak, karar sinyalini daha ana sahnede gosteriyoruz.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <MapPinned className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
              Güvenli temas
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Saticiya gecis daha net
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Moderasyon, raporlama ve dogrudan WhatsApp temasi birlikte calisarak daha kontrollu
              bir ilk iletisim akisi kuruyor.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <SectionHeader
          title="Güven veren sade deneyim"
          description="Kalabalık ilan siteleri yerine, güven ve hız odaklı net bir akış sunuyoruz."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {trustHighlights.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
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
