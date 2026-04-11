import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Fuel,
  MapPin,
  Settings2,
  Sparkles,
  Lock,
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { CompareButton } from "@/components/listings/compare-button";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ReportListingForm } from "@/components/forms/report-listing-form";
import { ShareButton } from "@/components/listings/share-button";
import { ListingCard } from "@/components/listings/listing-card";
import { PriceAnalysisCard } from "@/components/listings/price-analysis-card";
import { TrustBadge } from "@/components/shared/trust-badge";
import { ContactActions } from "@/components/listings/contact-actions";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
import { EIDSBadge } from "@/components/shared/eids-badge";
import { MobileStickyActions } from "@/components/listings/mobile-sticky-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { buildListingDetailMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { formatDate, formatNumber } from "@/lib/utils";
import {
  getMarketplaceListingBySlug,
  getMarketplaceSeller,
  getSimilarMarketplaceListings,
  getPublicMarketplaceListings,
} from "@/services/listings/marketplace-listings";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { getSellerTrustSummary } from "@/services/profile/profile-trust";

interface ListingDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const whatsappTemplate = "Merhaba, ilanınızla ilgileniyorum.";

export const dynamic = "force-dynamic";
export const revalidate = 60;

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
  const activeListingCount = (
    await getPublicMarketplaceListings()
  ).listings.filter((item) => item.sellerId === listing.sellerId).length;
  const insight = getListingCardInsights(listing);
  const trustSummary = getSellerTrustSummary(seller, activeListingCount);
  const currentUser = await getCurrentUser();
  
  // Use real market data if available, otherwise fallback to mock insights
  const marketPriceIndex = listing.marketPriceIndex || 1.0;
  const marketStatus = marketPriceIndex <= 0.95 ? "excellent" : marketPriceIndex >= 1.05 ? "high" : "fair";
  const marketAverage = listing.price / marketPriceIndex;
  const priceDiff = marketAverage - listing.price;

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

  const breadcrumbs = [
    { name: "İlanlar", url: "/listings" },
    { name: listing.brand, url: `/listings?brand=${encodeURIComponent(listing.brand)}` },
    { name: listing.model, url: `/listing/${listing.slug}` }
  ];

  return (
    <>
      <ListingDetailStructuredData listing={listing} url={buildAbsoluteUrl(`/listing/${listing.slug}`)} />
      <BreadcrumbStructuredData items={breadcrumbs.map(b => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))} />
      
      <MobileStickyActions 
          listingId={listing.id}
          price={listing.price}
          title={listing.title}
          isLoggedIn={!!currentUser}
          loginUrl={`/login?next=${encodeURIComponent(`/listing/${listing.slug}`)}`}
      />

      <main className="min-h-screen bg-slate-50/50 pb-20 lg:pb-0" role="main">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        
        <Breadcrumbs items={breadcrumbs} />

        {/* Title Section */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  {listing.brand} <span className="font-medium text-slate-500">{listing.model}</span>
                </h1>
                <div className="flex items-center gap-2">
                  {listing.eidsVerificationJson && (
                    <EIDSBadge isVerified={true} className="scale-110 shadow-emerald-500/20 shadow-lg" />
                  )}
                  {listing.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                      <Sparkles size={12} />
                      Öne Çıkan
                    </span>
                  )}
                </div>
              </div>
              <p className="text-base text-slate-600">
                {listing.title}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="text-3xl font-bold text-indigo-600">
                  {new Intl.NumberFormat("tr-TR").format(listing.price)} <span className="text-lg font-semibold text-slate-400">TL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                    <MapPin size={14} className="text-indigo-500" />
                    {listing.city} / {listing.district}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FavoriteButton
                listingId={listing.id}
                className="h-11 rounded-xl border border-slate-200 bg-white shadow-sm px-5 hover:bg-slate-50 font-medium text-sm gap-2 text-slate-700 flex items-center"
              />
              <ShareButton title={`${listing.brand} ${listing.model} - ${listing.title}`} price={listing.price} />
              <CompareButton
                listingId={listing.id}
                className="h-11 rounded-xl border border-indigo-200 bg-indigo-50 shadow-sm px-4 hover:bg-indigo-100 font-medium text-sm gap-1.5 text-indigo-700 flex items-center transition-colors"
              />
            </div>
          </div>
        </div>

        <article className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
            
            {/* Image Gallery with Slider */}
            <ListingGallery images={listing.images} title={listing.title} />

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickSpecs.map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 rounded-lg flex flex-col items-center justify-center text-center border text-slate-900 border-slate-200 bg-white shadow-sm transition-colors">
                  <Icon size={24} className="text-indigo-600 mb-2" />
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</span>
                  <span className="text-base font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* AI Insights & Trust Signals */}
            <div className={`rounded-lg p-5 shadow-sm ${heroToneClasses.panel}`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2 text-base ${heroToneClasses.text}`}>
                <Sparkles className={`size-5 ${heroToneClasses.icon}`} />
                Yapay Zeka Değerlendirmesi
              </h3>
              <p className={`mb-4 text-[14px] leading-relaxed ${heroToneClasses.text} opacity-90`}>
                {insight.summary}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {insight.highlights.map((highlight) => (
                  <div key={highlight} className={`flex items-center gap-2 font-medium bg-white px-3 py-2.5 rounded-md shadow-sm border border-white/50 text-[13px] ${heroToneClasses.text}`}>
                    <CheckCircle2 size={16} className={`shrink-0 ${heroToneClasses.check}`} />
                    {highlight}
                  </div>
                ))}
              </div>
            </div>

            {/* Damage & Tramer Report */}
            <DamageReportCard 
              damageStatus={listing.damageStatusJson} 
              tramerAmount={listing.tramerAmount} 
            />

            {/* Description */}
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">İlan Açıklaması</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </div>
            </section>

            {/* Expert Inspection */}
            <ExpertInspectionCard expertInspection={listing.expertInspection} />

            {/* Similar Listings */}
            {similarListings.length > 0 && (
              <section className="rounded-lg bg-transparent">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Benzer İlanlar</h2>
                <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {similarListings.map((item, index) => (
                    <div key={item.id} className={index !== 0 ? "border-t border-slate-100" : ""}>
                      <ListingCard listing={item} />
                    </div>
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
              marketPriceIndex={listing.marketPriceIndex ?? undefined}
            />

            {/* Seller Info */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="size-14 bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 rounded flex items-center justify-center font-bold text-xl border border-slate-200 shadow-sm">
                      {(seller?.fullName ?? "S").slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {seller?.fullName ?? "Satıcı"}
                        <EIDSBadge isVerified={!!seller?.eidsId} />
                      </div>
                      <div className="text-[13px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        Bireysel Satıcı
                      </div>
                    </div>
                  </div>
                </div>
                
                <TrustBadge
                  badgeLabel={trustSummary.badgeLabel}
                  score={trustSummary.score}
                />

                {currentUser ? (
                  <div className="mt-5">
                    <ContactActions
                      listingId={listing.id}
                    />
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 text-center">
                      <Lock className="size-5 text-indigo-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-indigo-900">
                        İletişim bilgilerini görmek için
                      </p>
                      <Link
                        href={`/login?next=${encodeURIComponent(`/listing/${listing.slug}`)}`}
                        className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        Giriş Yap
                      </Link>
                    </div>
                    <p className="text-xs text-center text-slate-500">
                      veya <Link href="/register" className="text-indigo-600 hover:underline">kayıt ol</Link> ücretsiz ilan oluştur
                    </p>
                  </div>
                )}
                
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="text-sm font-semibold text-slate-900 mb-2">Satıcı Özeti</div>
                  {trustSummary.signals.length > 0 ? (
                    <ul className="space-y-2">
                      {trustSummary.signals.map((signal) => (
                        <li key={signal} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={16} className="text-emerald-500" /> {signal}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Satıcı henüz ek güven sinyali paylaşmadı.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Safety Warning */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 flex items-start gap-3">
              <AlertTriangle size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                Güvenliğiniz için işlemi OtoBurada üzerinden gerçekleştirin. Aracı görmeden kapora göndermeyin.
              </p>
            </div>

            {/* Detailed Specs List */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 text-base">Detaylı Bilgiler</h3>
              <ul className="space-y-2.5 text-[13px]">
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
    </>
  );
}
