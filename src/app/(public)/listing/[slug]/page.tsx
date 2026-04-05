import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Fuel,
  MapPin,
  MessageCircle,
  Phone,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { ReportListingForm } from "@/components/forms/report-listing-form";
import { ListingCard } from "@/components/listings/listing-card";
import { SectionHeader } from "@/components/shared/section-header";
import { PriceAnalysisCard } from "@/components/listings/price-analysis-card";
import { TrustBadge } from "@/components/shared/trust-badge";
import { exampleListings } from "@/data";
import { getCurrentUser } from "@/lib/auth/session";
import { buildListingDetailMetadata } from "@/lib/seo";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import {
  getMarketplaceListingBySlug,
  getMarketplaceSeller,
  getSimilarMarketplaceListings,
} from "@/services/listings/marketplace-listings";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";

interface ListingDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const whatsappTemplate = "Merhaba, ilanınızla ilgileniyorum.";

export async function generateStaticParams() {
  return exampleListings.map((listing) => ({
    slug: listing.slug,
  }));
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);

  if (!listing) {
    return {
      title: "Ilan bulunamadi",
      description: "Ilan detay sayfasi bulunamadi.",
    };
  }

  return buildListingDetailMetadata(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const seller = await getMarketplaceSeller(listing.sellerId);
  const similarListings = await getSimilarMarketplaceListings(
    listing.slug,
    listing.brand,
    listing.city,
  );
  const insight = getListingCardInsights(listing);
  const currentUser = await getCurrentUser();
  const whatsappLink = `https://wa.me/${listing.whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappTemplate)}`;
  
  // Map tone to marketStatus for PriceAnalysisCard
  const marketStatus = insight.tone === "emerald" ? "excellent" : insight.tone === "amber" ? "high" : "fair";
  const priceDiff = marketStatus === "high" ? -15000 : 25000;

  const heroToneClasses = {
    amber: {
      badge: "border-amber-300/70 bg-amber-500 text-white",
      icon: "text-amber-600",
      panel: "bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100",
      text: "text-amber-900",
      check: "text-amber-500",
    },
    emerald: {
      badge: "border-emerald-300/70 bg-emerald-500 text-white",
      icon: "text-emerald-600",
      panel: "bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100",
      text: "text-emerald-900",
      check: "text-emerald-500",
    },
    indigo: {
      badge: "border-indigo-200 bg-indigo-600 text-white",
      icon: "text-indigo-600",
      panel: "bg-gradient-to-br from-indigo-50 to-blue-50/30 border border-indigo-100",
      text: "text-indigo-900",
      check: "text-indigo-500",
    },
  }[insight.tone];

  const quickSpecs = [
    {
      label: "Yıl",
      value: String(listing.year),
      icon: CalendarDays,
    },
    {
      label: "Kilometre",
      value: `${formatNumber(listing.mileage)}`,
      icon: CircleGauge,
    },
    {
      label: "Yakıt",
      value: listing.fuelType,
      icon: Fuel,
    },
    {
      label: "Vites",
      value: listing.transmission,
      icon: Settings2,
    },
  ];

  const allSpecs = [
    ...quickSpecs,
    {
      label: "Konum",
      value: `${listing.city} / ${listing.district}`,
      icon: MapPin,
    },
    {
      label: "Durum",
      value: "İkinci El",
      icon: CarFront,
    },
  ];

  return (
    <main className="bg-[#f8fafc] min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Vasıta</Link>
          <ChevronRight size={14} />
          <Link href="/listings" className="hover:text-indigo-600 transition-colors">Otomobil</Link>
          <ChevronRight size={14} />
          <Link href={`/listings?brand=${encodeURIComponent(listing.brand)}`} className="hover:text-indigo-600 transition-colors">{listing.brand}</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800">{listing.model}</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              {listing.brand} <span className="font-normal text-slate-500">{listing.model}</span>
            </h1>
            <p className="text-lg text-slate-600 flex flex-wrap items-center gap-2">
              {listing.title}
              <span className="inline-flex items-center gap-1 text-sm font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                <MapPin size={14} /> {listing.city} / {listing.district}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <FavoriteButton
              listingId={listing.id}
              className="h-10 rounded-xl border border-slate-200 bg-white shadow-sm px-4 hover:bg-slate-50 font-medium text-sm gap-2 text-slate-700"
            />
          </div>
        </div>

        <article className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-8">
            
            {/* Main Image Gallery */}
            <section className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm border border-slate-200/60">
              <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10] overflow-hidden rounded-xl bg-slate-200">
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    priority
                    sizes="(min-width: 1280px) 70vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${heroToneClasses.badge}`}
                    >
                      {insight.badgeLabel}
                    </span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
                      {listing.featured ? "Öne Çıkan İlan" : "Yayında"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                  {listing.images.slice(1, 6).map((image, index) => (
                    <div
                      key={image.id ?? image.url}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-200 ring-1 ring-slate-900/5"
                    >
                      <Image
                        src={image.url}
                        alt={`${listing.title} görsel ${image.order + 1}`}
                        fill
                        sizes="(min-width: 640px) 190px, 20vw"
                        className="object-cover"
                      />
                      {index === 4 && listing.images.length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-medium text-sm sm:text-base">+{listing.images.length - 6}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickSpecs.map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-5 rounded-2xl flex flex-col items-center justify-center text-center border text-slate-900 border-slate-200 bg-white shadow-sm hover:border-indigo-200 transition-colors">
                  <Icon size={28} className="text-indigo-600 mb-3" />
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</span>
                  <span className="text-lg font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* AI Insights & Trust Signals */}
            <div className={`rounded-2xl p-6 shadow-sm ${heroToneClasses.panel}`}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 text-lg ${heroToneClasses.text}`}>
                <Sparkles className={`size-[22px] ${heroToneClasses.icon}`} />
                Yapay Zeka Değerlendirmesi
              </h3>
              <p className={`mb-6 text-[15px] leading-relaxed ${heroToneClasses.text} opacity-90`}>
                {insight.summary}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {insight.highlights.map((highlight) => (
                  <div key={highlight} className={`flex items-center gap-3 font-medium bg-white px-4 py-3 rounded-xl shadow-sm border border-white/50 ${heroToneClasses.text}`}>
                    <CheckCircle2 size={20} className={`shrink-0 ${heroToneClasses.check}`} />
                    {highlight}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">İlan Açıklaması</h2>
              <div className="space-y-4 text-lg leading-relaxed text-slate-700">
                <p className="whitespace-pre-wrap">{listing.description}</p>
                <p>Araç başında ufak bir pazarlık payı vardır. Alıcısına şimdiden hayırlı olsun.</p>
              </div>
            </section>

            {/* Similar Listings */}
            {similarListings.length > 0 && (
              <section className="rounded-2xl bg-transparent">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Benzer İlanlar</h2>
                <div className="space-y-4">
                  {similarListings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Action Cards */}
          <aside className="w-full lg:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-24">
            
            {/* Price & Market Analysis Card */}
            <PriceAnalysisCard 
              price={listing.price} 
              marketStatus={marketStatus} 
              priceDiff={priceDiff} 
            />

            {/* Seller Info */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="size-16 bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-white shadow-sm">
                      {(seller?.fullName ?? "S").slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                        {seller?.fullName ?? "Doğrulanmış Satıcı"}
                        <ShieldCheck className="size-5 text-blue-500" />
                      </div>
                      <div className="text-[13px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        Bireysel Satıcı
                      </div>
                    </div>
                  </div>
                </div>
                
                <TrustBadge score={9.8} verified={true} />

                <div className="space-y-3 mt-6">
                  <a
                    href={`tel:${listing.whatsappPhone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 h-14 px-5 text-[17px] font-semibold text-white shadow-md transition-all hover:bg-slate-800"
                  >
                    <Phone className="size-[22px]" />
                    {listing.whatsappPhone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4")}
                  </a>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white h-14 px-5 text-[17px] text-slate-800 font-semibold shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <MessageCircle className="size-[22px]" />
                    Mesaj Gönder
                  </a>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-sm font-semibold text-slate-900 mb-3">Satıcı Güvenilirlik Özeti</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500" /> Kimlik doğrulandı
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500" /> Telefon doğrulandı
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500" /> 5+ yıldır üye
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Safety Warning */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex items-start gap-3">
              <AlertTriangle size={20} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Güvenliğiniz için işlemi OtoBurada üzerinden gerçekleştirin. Aracı görmeden kapora veya ön ödeme göndermeyin.
              </p>
            </div>

            {/* Detailed Specs List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Detaylı Bilgiler</h3>
              <ul className="space-y-3 text-[14px]">
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">İlan No</span>
                  <span className="font-semibold text-slate-900">{listing.id.split('-')[0]}</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">İlan Tarihi</span>
                  <span className="font-semibold text-slate-900">{formatDate(listing.createdAt)}</span>
                </li>
                {allSpecs.map((spec) => (
                  <li key={spec.label} className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-500">{spec.label}</span>
                    <span className="font-semibold text-slate-900 w-1/2 text-right truncate" title={spec.value}>{spec.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <ReportListingForm
                listingId={listing.id}
                sellerId={listing.sellerId}
                userId={currentUser?.id ?? null}
              />
            </div>
          </aside>
        </article>
      </div>
    </main>
  );
}
