import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Zap,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { CarCard } from "@/components/modules/listings/car-card";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
import { MarketValueCard } from "@/components/listings/market-value-card";
import { ViewCounter } from "@/components/listings/view-counter";
import { PriceHistoryChart } from "@/components/listings/price-history-chart";
import { ListingSpecs } from "@/components/listings/listing-specs";
import { TrustSummary } from "@/components/listings/trust-summary";
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
import { getCurrentUser } from "@/lib/auth/session";
import { getSellerRatingSummary } from "@/services/profile/seller-reviews";
import { getMemberSinceYear, getMembershipYears, buildWhatsAppOfferLink } from "@/lib/utils/listing-utils";
import { listingDetail, breadcrumbs as breadcrumbLabels } from "@/lib/constants/ui-strings";

// const SellerReviewForm = dynamic(
//   () => import("@/components/listings/seller-review-form").then((mod) => mod.SellerReviewForm),
// );

const ListingMap = dynamic(
  () => import("@/components/shared/listing-map-wrapper").then((mod) => mod.ListingMapWrapper),
  { loading: () => <div className="h-60 animate-pulse rounded-xl bg-muted" /> }
);

const ListingDetailActions = dynamic(
  () => import("@/components/listings/listing-detail-actions").then((mod) => mod.ListingDetailActions),
  {
    loading: () => <div className="h-9 w-44 animate-pulse rounded-lg bg-muted" />,
  },
);

const ContactActions = dynamic(
  () => import("@/components/listings/contact-actions").then((mod) => mod.ContactActions),
  {
    loading: () => <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />,
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
  if (!listing) return { title: "Ã„Â°lan BulunamadÃ„Â±" };
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
  // const canReview = Boolean(currentUser && currentUser.id !== listing.sellerId);

  // Server-side view kaydÃ„Â± (dedup: kullanÃ„Â±cÃ„Â±/IP bazlÃ„Â± gÃƒÂ¼nlÃƒÂ¼k)
  const headersList = await headers();
  const viewerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? headersList.get("x-real-ip")
    ?? undefined;
  // Fire-and-forget Ã¢â‚¬â€ view kaydÃ„Â± sayfayÃ„Â± bloklamasÃ„Â±n
  recordListingView(listing.id, {
    viewerId: currentUser?.id,
    viewerIp,
  }).catch(() => {});

  // Server-side listing view event Ã¢â‚¬â€ fires once per SSR render
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
  const memberSince = getMemberSinceYear(seller?.createdAt ?? null);
  const membershipYears = getMembershipYears(memberSince);
  
  const pageBreadcrumbs = [
    { name: breadcrumbLabels.home, url: "/" },
    { name: breadcrumbLabels.cars, url: "/listings" },
    { name: listing.brand, url: `/listings?brand=${encodeURIComponent(listing.brand)}` },
    { name: listing.model, url: `/listing/${listing.slug}` }
  ];

  return (
    <>
      <ListingDetailStructuredData listing={listing} url={buildAbsoluteUrl(`/listing/${listing.slug}`)} sellerName={seller?.businessName ?? seller?.fullName ?? undefined} />
      <BreadcrumbStructuredData items={pageBreadcrumbs.map(b => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))} />
      
      <MobileStickyActions
          listingId={listing.id}
          listingSlug={listing.slug}
          sellerId={listing.sellerId}
          price={listing.price}
          currentUserId={currentUser?.id ?? null}
      /> 

      <main className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-500 selection:text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-10 w-full flex-1">
          
          {/* Top Header/Breadcrumb Area */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
            <nav className="flex flex-wrap items-center gap-3">
              {pageBreadcrumbs.map((b, i) => (
                <div key={b.url} className="flex items-center gap-3">
                  <Link href={b.url} className={cn(
                    "text-[11px] font-black uppercase tracking-widest transition-all hover:text-blue-600",
                    i === pageBreadcrumbs.length - 1 ? "text-slate-900" : "text-slate-400"
                  )}>
                    {b.name}
                  </Link>
                  {i < pageBreadcrumbs.length - 1 && (
                    <div className="size-1 rounded-full bg-slate-200" />
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ListingDetailActions
                listingId={listing.id}
                price={listing.price}
                sellerId={listing.sellerId}
                title={listing.title}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-12">
            
            {/* Left Column */}
            <div className="w-full min-w-0 flex-1 space-y-10">
              
              {/* Image Gallery Container */}
              <div className="relative group">
                <div className="bg-white rounded-[3rem] p-6 border border-slate-200 shadow-2xl shadow-slate-200/50">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-[2.5rem] border border-slate-100 bg-slate-50 group-hover:shadow-lg transition-all duration-500">
                    <ListingGallery images={listing.images} title={listing.title} />
                    
                    {/* Floating Showroom Badges */}
                    <div className="absolute left-8 top-8 z-20 flex flex-col gap-3">
                      {listing.featured && (
                        <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/10">
                          <Zap size={14} className="text-amber-400 animate-pulse" />
                          Ãƒâ€“NE Ãƒâ€¡IKAN Ã„Â°LAN
                        </div>
                      )}
                      {listing.expertInspection && (
                        <div className="bg-white/90 backdrop-blur-xl text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-2xl shadow-xl border border-white flex items-center gap-2">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          EKSPERTÃ„Â°Z ONAYLI
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Price Card */}
              <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -mr-32 -mt-32" />
                
                <div className="space-y-6 relative z-10 w-full">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{listing.brand}</span>
                       <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{listing.year} MODELL</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                      {listing.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <svg className="size-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      {listing.city}, {listing.district}
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-slate-50 rounded-xl">
                        <svg className="size-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      {new Date(listing.createdAt).toLocaleDateString("tr-TR")} GÃƒÅ“NCELLENDÃ„Â°
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <Zap size={14} className="text-slate-400" />
                      </div>
                      Ã„Â°LAN NO: {listing.id.slice(0, 8).toUpperCase()}
                    </div>
                    <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
                  </div>
                </div>

                <div className="text-left md:text-right w-full md:w-auto relative z-10">
                  <div className="text-5xl md:text-6xl font-black text-blue-600 tracking-tighter mb-1">
                    {new Intl.NumberFormat("tr-TR").format(listing.price)}<span className="text-2xl ml-1">TL</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">RESMÃ„Â° SATIÃ…Â FÃ„Â°YATI</p>
                </div>
              </div>

              {/* Key Specs Grid */}
              <ListingSpecs listing={listing} />

              {/* Status & Trust Overview */}
              <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-20 -mr-48 -mt-48" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8 relative">{listingDetail.trustSummary}</h2>
                <TrustSummary 
                  listing={listing} 
                  seller={seller} 
                  updatedAt={listing.updatedAt} 
                />
              </div>

              {/* Technical RecordsSection */}
              <div id="ekspertiz" className="scroll-mt-24 space-y-10">
                {/* Ekspertiz Raporu */}
                <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="flex items-center gap-4 text-xl font-black text-slate-900 tracking-tight">
                      <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      Ekspertiz Raporu
                    </h2>
                    {listing.expertInspection?.documentUrl && (
                      <a
                        href={listing.expertInspection.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PDF RAPORU GÃƒâ€“RÃƒÅ“NTÃƒÅ“LE
                      </a>
                    )}
                  </div>
                  <ExpertInspectionCard expertInspection={listing.expertInspection} />
                </div>

                {/* Kaporta & Boya */}
                <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm">
                  <h2 className="mb-8 flex items-center gap-4 text-xl font-black text-slate-900 tracking-tight">
                    <div className="size-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                       <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                      </svg>
                    </div>
                    Kaporta & Boya Durumu
                  </h2>
                  <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />
                </div>
              </div>

              {/* Market Analysis */}
              <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
                <h2 className="mb-8 flex items-center gap-4 text-xl font-black text-slate-900 tracking-tight relative">
                  <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  Piyasa Analizi
                </h2>
                <div className="grid gap-10 lg:grid-cols-2 relative lg:items-center">
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 italic font-medium text-slate-600 leading-relaxed relative">
                       <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400">Yapay Zeka Ãƒâ€“zeti</div>
                       &ldquo;{insight.summary}&rdquo;
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {insight.highlights.map(h => (
                        <div key={h} className="rounded-xl bg-white border border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                  <MarketValueCard listing={listing} />
                </div>
              </div>

              {/* Price History */}
              {priceHistory.length >= 2 && (
                <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm">
                  <h2 className="mb-8 flex items-center gap-4 text-xl font-black text-slate-900 tracking-tight">
                    <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <TrendingUp size={24} />
                    </div>
                    Fiyat DeÃ„Å¸iÃ…Å¸im Trendi
                  </h2>
                  <PriceHistoryChart history={priceHistory} currentPrice={listing.price} />
                </div>
              )}

              {/* Description */}
              <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm">
                <h2 className="mb-6 text-xl font-black text-slate-900 tracking-tight">Ã„Â°lan HakkÃ„Â±nda</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-base leading-loose text-slate-600 font-medium whitespace-pre-wrap">{listing.description}</p>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm" style={{ isolation: "isolate" }}>
                <h2 className="mb-8 flex items-center gap-4 text-xl font-black text-slate-900 tracking-tight">
                  <div className="size-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  GerÃƒÂ§ek Konum
                </h2>
                <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
                   <ListingMap city={listing.city} district={listing.district} className="h-80" />
                </div>
              </div>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <div className="pt-10 border-t border-slate-200/50">
                  <h2 className="mb-10 text-3xl font-black text-slate-900 tracking-tighter">Sizin Ã„Â°ÃƒÂ§in SeÃƒÂ§tiklerimiz</h2>
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {similarListings.map((item, index) => (
                      <CarCard key={item.id} listing={item} priority={index < 2} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="w-full lg:w-96 flex-shrink-0 space-y-8 lg:sticky lg:top-24">
              
              {/* Seller Card - Elite UI */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ã„Â°LAN SAHÃ„Â°BÃ„Â°</h2>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{seller?.userType === "professional" ? "Kurumsal Galeri" : "Bireysel SatÃ„Â±cÃ„Â±"}</p>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="relative size-16 rounded-[1.5rem] border-4 border-slate-50 shadow-lg bg-white overflow-hidden flex items-center justify-center">
                        {seller?.businessLogoUrl ? (
                          <Image src={seller.businessLogoUrl} alt={seller.fullName || ""} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="size-full bg-slate-100 flex items-center justify-center font-black text-xl text-slate-300">
                             {seller?.fullName?.[0] || "S"}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
                        <div className="size-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{seller?.businessName || seller?.fullName}</h3>{seller?.verifiedBusiness && (<div className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200" title="DoÄŸrulanmÄ±ÅŸ Ä°ÅŸletme"><ShieldCheck size={12} strokeWidth={3} /></div>)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {seller?.isVerified && (
                           <div className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-blue-100">ONAYLI ÃƒÅ“YE</div>
                        )}
                        {membershipYears !== null && <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">EST. {memberSince}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ContactActions listingId={listing.id} listingSlug={listing.slug} sellerId={listing.sellerId} currentUserId={currentUser?.id ?? null} />
                  </div>

                  {/* Seller rating */}
                  {sellerRatingSummary.count > 0 && (
                    <div className="pt-8 border-t border-slate-50">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MEMNUNÃ„Â°YET</span>
                         <span className="text-lg font-black text-slate-900 tracking-tighter">{sellerRatingSummary.average.toFixed(1)}/5.0</span>
                       </div>
                       <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className={cn(
                            "h-1.5 flex-1 rounded-full",
                            star <= Math.round(sellerRatingSummary.average) ? "bg-amber-400" : "bg-slate-100"
                          )} />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest text-center">{sellerRatingSummary.count} DEÃ„ÂERLENDÃ„Â°RME</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-50 space-y-4">
                    <Link href={seller?.businessSlug ? `/gallery/${seller.businessSlug}` : `/seller/${listing.sellerId}`} className="flex justify-between items-center group/link">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/link:text-blue-600 transition-colors">TÃƒÅ“M Ã„Â°LANLARI</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover/link:translate-x-1 group-hover/link:text-blue-600 transition-all" />
                    </Link>
                    <Link href="#ekspertiz" className="flex justify-between items-center group/link">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/link:text-emerald-600 transition-colors">RANDEVU OLUÃ…ÂTUR</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover/link:translate-x-1 group-hover/link:text-emerald-600 transition-all" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Offer - Premium Glass */}
              <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute -right-20 -bottom-20 size-80 bg-blue-500 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      HÃ„Â±zlÃ„Â± Teklif
                    </h3>
                    <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest opacity-80">BEKLEMEDEN SÃƒÅ“RECÃ„Â° BAÃ…ÂLAT</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <a href={buildWhatsAppOfferLink(listing.whatsappPhone, listing.title, Math.round(listing.price * 0.95))} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white py-4 rounded-2xl text-sm font-black transition-all text-center tracking-tight">Ã¢â€šÂº{new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.95))} (%5 Ã„Â°ndirim)</a>
                    <a href={buildWhatsAppOfferLink(listing.whatsappPhone, listing.title, Math.round(listing.price * 0.98))} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white py-4 rounded-2xl text-sm font-black transition-all text-center tracking-tight">Ã¢â€šÂº{new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.98))} (%2 Ã„Â°ndirim)</a>
                  </div>
                  
                  <a href={buildWhatsAppOfferLink(listing.whatsappPhone, listing.title)} target="_blank" rel="noreferrer" className="w-full bg-white text-blue-600 font-black h-16 rounded-[1.5rem] transition-all hover:scale-105 active:scale-95 shadow-xl flex justify-center items-center uppercase text-[11px] tracking-[0.2em]">
                    KENDÃ„Â° TEKLÃ„Â°FÃ„Â°NÃ„Â° YAP
                  </a>
                </div>
              </div>

              {/* Security - Minimal Premium */}
              <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ShieldCheck size={18} className="text-emerald-500" />
                   GÃƒÅ“VENLÃ„Â°K PROTOKOLLERÃ„Â°
                </h3>
                <div className="space-y-5">
                   {[
                     "AracÃ„Â± gÃƒÂ¶rmeden kapora gÃƒÂ¶ndermeyiniz.",
                     "Resmi ekspertiz raporu talep ediniz.",
                     "Ãƒâ€“demeyi gÃƒÂ¼venli noter kanalÃ„Â±yla yapÃ„Â±nÃ„Â±z."
                   ].map(tip => (
                     <div key={tip} className="flex gap-4">
                        <div className="size-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">{tip}</p>
                     </div>
                   ))}
                </div>
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <Link href="/support" className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors">
                    <div className="size-8 rounded-xl bg-rose-50 flex items-center justify-center">
                       <XCircle size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Ã„Â°LANÃ„Â° Ã…ÂÃ„Â°KAYET ET</span>
                  </Link>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </main>

    </>
  );
}
