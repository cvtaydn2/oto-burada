import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CircleGauge,
  Fuel,
  Settings2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { CarCard } from "@/components/modules/listings/car-card";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
import { MarketValueCard } from "@/components/listings/market-value-card";
import { ViewCounter } from "@/components/listings/view-counter";
import { PriceHistoryChart } from "@/components/listings/price-history-chart";
import { buildListingDetailMetadata, buildAbsoluteUrl } from "@/lib/seo";
import {
  getMarketplaceListingBySlug,
  getMarketplaceSeller,
  getSimilarMarketplaceListings,
} from "@/services/listings/marketplace-listings";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { getListingPriceHistory } from "@/services/listings/listing-price-history";
import { captureServerEvent } from "@/lib/monitoring/posthog-server";
import { recordListingView } from "@/services/listings/listing-views";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getSellerRatingSummary } from "@/services/profile/seller-reviews";

const SellerReviewForm = dynamic(
  () => import("@/components/listings/seller-review-form").then((mod) => mod.SellerReviewForm),
);

const ListingMap = dynamic(
  () => import("@/components/shared/listing-map-wrapper").then((mod) => mod.ListingMapWrapper),
  { loading: () => <div className="h-60 animate-pulse rounded-xl bg-slate-100" /> }
);

const ListingDetailActions = dynamic(
  () => import("@/components/listings/listing-detail-actions").then((mod) => mod.ListingDetailActions),
  {
    loading: () => <div className="h-9 w-44 animate-pulse rounded-lg bg-slate-100" />,
  },
);

const ContactActions = dynamic(
  () => import("@/components/listings/contact-actions").then((mod) => mod.ContactActions),
  {
    loading: () => <div className="h-36 w-full animate-pulse rounded-xl bg-slate-100" />,
  },
);

const MobileStickyActions = dynamic(
  () => import("@/components/listings/mobile-sticky-actions").then((mod) => mod.MobileStickyActions),
);

interface ListingDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);
  if (!listing) return { title: "İlan Bulunamadı" };
  return buildListingDetailMetadata(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);

  if (!listing) notFound();

  const [seller, similarListings] = await Promise.all([
    getMarketplaceSeller(listing.sellerId),
    getSimilarMarketplaceListings(listing.slug, listing.brand, listing.city),
  ]);

  const [currentUser, sellerRatingSummary, priceHistory] = await Promise.all([
    getCurrentUser(),
    getSellerRatingSummary(listing.sellerId),
    getListingPriceHistory(listing.id),
  ]);

  // Buyer can review if: logged in AND not the seller
  const canReview = Boolean(currentUser && currentUser.id !== listing.sellerId);

  // Server-side view kaydı (dedup: kullanıcı/IP bazlı günlük)
  const headersList = await headers();
  const viewerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? headersList.get("x-real-ip")
    ?? undefined;
  // Fire-and-forget — view kaydı sayfayı bloklamasın
  recordListingView(listing.id, {
    viewerId: currentUser?.id,
    viewerIp,
  }).catch(() => {});

  // Server-side listing view event — fires once per SSR render
  captureServerEvent("listing_viewed", {
    listingId: listing.id,
    listingSlug: listing.slug,
    brand: listing.brand,
    model: listing.model,
    city: listing.city,
    price: listing.price,
    year: listing.year,
    status: listing.status,
  });
  const insight = getListingCardInsights(listing);
  const memberSince = seller?.createdAt
    ? new Date(seller.createdAt).getFullYear()
    : null;
  const membershipYears = memberSince
    ? Math.max(new Date().getFullYear() - memberSince, 0)
    : null;
  const whatsappPhoneDigits = listing.whatsappPhone.replace(/\D/g, "");
  const buildOfferLink = (offerPrice?: number) => {
    if (!whatsappPhoneDigits) {
      return "#";
    }

    const message = offerPrice
      ? `${listing.title} ilanınız için ${new Intl.NumberFormat("tr-TR").format(offerPrice)} TL teklif vermek istiyorum.`
      : `${listing.title} ilanınız için size özel teklif paylaşmak istiyorum.`;

    return `https://wa.me/${whatsappPhoneDigits}?text=${encodeURIComponent(message)}`;
  };

  const breadcrumbs = [
    { name: "Ana Sayfa", url: "/" },
    { name: "Otomobil", url: "/listings" },
    { name: listing.brand, url: `/listings?brand=${encodeURIComponent(listing.brand)}` },
    { name: listing.model, url: `/listing/${listing.slug}` }
  ];

  return (
    <>
      <ListingDetailStructuredData listing={listing} url={buildAbsoluteUrl(`/listing/${listing.slug}`)} sellerName={seller?.businessName ?? seller?.fullName ?? undefined} />
      <BreadcrumbStructuredData items={breadcrumbs.map(b => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))} />
      
      <MobileStickyActions
          listingId={listing.id}
          listingSlug={listing.slug}
          sellerId={listing.sellerId}
          price={listing.price}
          currentUserId={currentUser?.id ?? null}
      /> 

      <main className="min-h-screen bg-gray-50 flex flex-col">
        <div className="mx-auto max-w-[1400px] px-4 py-6 w-full flex-1">
          
          {/* Top Header/Breadcrumb Area */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <nav className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-medium text-gray-500">
              {breadcrumbs.map((b, i) => (
                <div key={b.url} className="flex items-center gap-2">
                  <Link href={b.url} className={cn("hover:text-blue-500 transition-colors whitespace-nowrap", i === breadcrumbs.length - 1 ? "text-gray-700" : "")}>
                    {b.name}
                  </Link>
                  {i < breadcrumbs.length - 1 && (
                    <svg className="size-2 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <ListingDetailActions
                listingId={listing.id}
                price={listing.price}
                sellerId={listing.sellerId}
                title={listing.title}
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-10">
            
            {/* Left Column */}
            <div className="w-full min-w-0 flex-1 space-y-6">
              
              {/* Image Gallery Container */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-gray-100 bg-gray-50 group">
                  <ListingGallery images={listing.images} title={listing.title} />
                  
                  {/* Badges */}
                  <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
                    {listing.featured && (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md">Öne Çıkan İlan</span>
                    )}
                    {listing.expertInspection && (
                      <span className="bg-white text-gray-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md border border-gray-200 flex items-center">
                        <ShieldCheck size={13} className="text-blue-500 mr-1.5" />
                        Ekspertiz Onaylı
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Price Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 leading-tight">
                    {listing.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <span>{listing.brand}</span>
                    <span className="size-1 rounded-full bg-gray-300" />
                    <span>{listing.model}</span>
                    {listing.carTrim ? (
                      <>
                        <span className="size-1 rounded-full bg-gray-300" />
                        <span>{listing.carTrim}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                    <span className="flex items-center">
                      <svg className="size-3.5 mr-1.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {listing.city}, {listing.district}
                    </span>
                    <span className="flex items-center">
                      <svg className="size-3.5 mr-1.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {new Date(listing.createdAt).toLocaleDateString("tr-TR")} güncellendi
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px] text-gray-600 font-bold uppercase tracking-wider">İlan No: {listing.id.slice(0, 8).toUpperCase()}</span>
                    <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
                  </div>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <div className="text-3xl md:text-4xl font-extrabold text-blue-500 tracking-tighter">
                    {new Intl.NumberFormat("tr-TR").format(listing.price)} TL
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Son güncelleme: {new Date(listing.updatedAt).toLocaleDateString("tr-TR")}</div>
                </div>
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SpecBox icon={<CalendarDays className="size-5" />} label="Model Yılı" value={String(listing.year)} />
                <SpecBox icon={<CircleGauge className="size-5" />} label="Kilometre" value={`${formatNumber(listing.mileage)} km`} />
                <SpecBox icon={<Fuel className="size-5" />} label="Yakıt Tipi" value={listing.fuelType} />
                <SpecBox icon={<Settings2 className="size-5" />} label="Vites Tipi" value={listing.transmission} />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-5 text-lg font-bold text-slate-900">Güven ve Durum Özeti</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <TrustCard
                    title="Ekspertiz"
                    value={listing.expertInspection?.hasInspection ? "Var" : "Paylaşılmadı"}
                    description={listing.expertInspection?.inspectionDate ? `${new Date(listing.expertInspection.inspectionDate).toLocaleDateString("tr-TR")} tarihli rapor` : "Bağımsız ekspertiz kaydı görünmüyor"}
                    tone={listing.expertInspection?.hasInspection ? "emerald" : "amber"}
                  />
                  <TrustCard
                    title="Tramer"
                    value={listing.tramerAmount && listing.tramerAmount > 0 ? `${new Intl.NumberFormat("tr-TR").format(listing.tramerAmount)} TL` : "Kayıt yok"}
                    description={listing.tramerAmount && listing.tramerAmount > 0 ? "Hasar kaydı var, detayları aşağıda inceleyin" : "Beyan edilen hasar kaydı görünmüyor"}
                    tone={listing.tramerAmount && listing.tramerAmount > 0 ? "amber" : "emerald"}
                  />
                  <TrustCard
                    title="Satıcı"
                    value={seller?.isVerified ? "Onaylı" : "Aktif Profil"}
                    description={seller?.isVerified ? "Satıcı profili doğrulanmış" : "Satıcı profili yayında"}
                    tone={seller?.isVerified ? "emerald" : "slate"}
                  />
                  <TrustCard
                    title="İlan Güncelliği"
                    value={new Date(listing.updatedAt).toLocaleDateString("tr-TR")}
                    description="Fiyat ve açıklama değişiklikleri son güncelleme tarihine göre okunmalı"
                    tone="blue"
                  />
                </div>
              </div>

              {/* Expert Inspection + Damage - Tasarıma göre aynı section */}
              <div id="ekspertiz" className="scroll-mt-24 space-y-6">
                {/* Ekspertiz Raporu */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      Ekspertiz Raporu
                    </h2>
                    {listing.expertInspection?.documentUrl && (
                      <a
                        href={listing.expertInspection.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition hover:border-blue-500 hover:text-blue-600"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Raporu İndir (PDF)
                      </a>
                    )}
                  </div>
                  <ExpertInspectionCard expertInspection={listing.expertInspection} />
                </div>

                {/* Kaporta & Boya - Tasarıma göre ayrı section */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <svg className="size-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                    </svg>
                    Kaporta & Boya Durumu
                  </h2>
                  <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />
                </div>
              </div>

              {/* Market Analysis */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Zap size={20} className="text-primary" />
                  Piyasa Analizi
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-sm text-slate-600 leading-relaxed">{insight.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.highlights.map(h => (
                        <span key={h} className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{h}</span>
                      ))}
                    </div>
                  </div>
                  <MarketValueCard listing={listing} />
                </div>
              </div>

              {/* Price History */}
              {priceHistory.length >= 2 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Zap size={20} className="text-amber-500" />
                    Fiyat Geçmişi
                  </h2>
                  <PriceHistoryChart history={priceHistory} currentPrice={listing.price} />
                </div>
              )}

              {/* Description */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Açıklama</h2>
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {/* Location Map — OpenStreetMap, ücretsiz */}
              <div className="rounded-xl border border-slate-200 bg-white p-6" style={{ isolation: "isolate" }}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <svg className="size-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  Konum
                </h2>
                <ListingMap city={listing.city} district={listing.district} className="h-60" />
              </div>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <div>
                  <h2 className="mb-6 text-lg font-bold text-slate-900">Benzer ilanlar</h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {similarListings.map((item, index) => (
                      <CarCard key={item.id} listing={item} priority={index < 2} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-6 lg:sticky lg:top-24">
              
              {/* Seller Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-1">Satıcı Bilgileri</h2>
                <p className="text-xs text-gray-500 mb-6">{seller?.userType === "professional" ? "Kurumsal Galeri" : "Bireysel Satıcı"}</p>
                
                <div className="flex items-center mb-6">
                  <div className="relative mr-4 shrink-0">
                    <div className="relative size-14 rounded-full border-2 border-white shadow-md bg-gray-50 overflow-hidden flex items-center justify-center font-bold text-gray-300">
                      {seller?.businessLogoUrl ? (
                        <Image src={seller.businessLogoUrl} alt={seller.fullName || ""} fill className="object-cover" />
                      ) : (
                        seller?.fullName?.[0] || "S"
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{seller?.businessName || seller?.fullName}</h3>
                    <div className="flex items-center text-[10px] text-gray-500 mt-0.5 mb-1">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded mr-1 font-medium",
                        seller?.isVerified ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {seller?.isVerified ? "Onaylı Üye" : "Profil aktif"}
                      </span>
                      {membershipYears !== null ? <span>• {membershipYears} yıldır üye</span> : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <ContactActions listingId={listing.id} listingSlug={listing.slug} sellerId={listing.sellerId} currentUserId={currentUser?.id ?? null} />
                </div>

                {/* Seller rating summary */}
                {sellerRatingSummary.count > 0 && (
                  <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={cn(
                            "size-3.5",
                            star <= Math.round(sellerRatingSummary.average)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-100 text-slate-200",
                          )}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {sellerRatingSummary.average.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({sellerRatingSummary.count} değerlendirme)
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {seller?.businessSlug && (
                    <Link href={`/gallery/${seller.businessSlug}`} className="flex justify-between items-center text-sm font-medium text-gray-600 hover:text-blue-500 transition group">
                      Satıcının diğer ilanları 
                      <svg className="size-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  )}
                  {!seller?.businessSlug && (
                    <Link href={`/seller/${listing.sellerId}`} className="flex justify-between items-center text-sm font-medium text-gray-600 hover:text-blue-500 transition group">
                      Satıcının diğer ilanları 
                      <svg className="size-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  )}
                  <Link href="#ekspertiz" className="flex justify-between items-center text-sm font-medium text-gray-600 hover:text-blue-500 transition group">
                    Ekspertiz randevusu al
                    <svg className="size-2.5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Seller Review Form — only for logged-in non-sellers */}
              {canReview && (
                <SellerReviewForm
                  sellerId={listing.sellerId}
                  listingId={listing.id}
                  sellerName={seller?.businessName ?? seller?.fullName ?? "Satıcı"}
                />
              )}

              {/* Quick Offer */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                  <svg className="size-4 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/><path d="m17.41 17.41-2.82-2.82"/>
                  </svg>
                  Hızlı Teklif Ver
                </h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Aracı beğendiniz mi? Satıcıya hızlı bir fiyat teklifi göndererek süreci başlatabilirsiniz.</p>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <a href={buildOfferLink(Math.round(listing.price * 0.95))} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold hover:border-blue-500 transition shadow-sm text-center">₺{new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.95))}</a>
                  <a href={buildOfferLink(Math.round(listing.price * 0.98))} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold hover:border-blue-500 transition shadow-sm text-center">₺{new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.98))}</a>
                </div>
                <a href={buildOfferLink()} target="_blank" rel="noreferrer" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition shadow flex justify-center items-center">
                  Kendi Teklifini Yap
                </a>
              </div>

              {/* Security Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
                   <ShieldCheck size={16} className="text-green-500 mr-2" />
                   Güvenli Alışveriş Tüyoları
                </h3>
                <ul className="text-xs text-gray-600 space-y-2 mb-4 pl-1">
                  <li className="flex items-start"><span className="text-gray-400 mr-2">•</span> Aracı görmeden kesinlikle kapora göndermeyin.</li>
                  <li className="flex items-start"><span className="text-gray-400 mr-2">•</span> Ekspertiz raporunu yetkili servislerde onaylatın.</li>
                  <li className="flex items-start"><span className="text-gray-400 mr-2">•</span> Ödemeyi noter huzurunda güvenli sistemlerle yapın.</li>
                </ul>
                <Link href="/support" className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center transition-colors">
                  <svg className="size-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  İlanı Şikayet Et
                </Link>
              </div>

            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function SpecBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center shadow-sm">
      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-bold text-gray-800 capitalize leading-tight">{value}</div>
      </div>
    </div>
  );
}

function TrustCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: "emerald" | "amber" | "blue" | "slate";
}) {
  const toneClasses = {
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  } as const;

  return (
    <div className={cn("rounded-xl border p-4", toneClasses[tone])}>
      <div className="text-[11px] font-black uppercase tracking-widest">{title}</div>
      <div className="mt-2 text-lg font-black">{value}</div>
      <p className="mt-2 text-xs font-medium leading-relaxed opacity-90">{description}</p>
    </div>
  );
}
