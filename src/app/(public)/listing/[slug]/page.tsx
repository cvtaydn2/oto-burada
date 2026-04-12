import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Fuel,
  Settings2,
  Sparkles,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { CompareButton } from "@/components/listings/compare-button";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ViewCounter } from "@/components/listings/view-counter";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { ReportListingForm } from "@/components/forms/report-listing-form";
import { ShareButton } from "@/components/listings/share-button";
import { CarCard } from "@/components/modules/listings/car-card";
import { ContactActions } from "@/components/listings/contact-actions";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
import { ListingPrintAction } from "@/components/listings/listing-print-action";
import { MarketValueCard } from "@/components/listings/market-value-card";
import { MobileStickyActions } from "@/components/listings/mobile-sticky-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { buildListingDetailMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { cn, formatNumber } from "@/lib/utils";
import {
  getMarketplaceListingBySlug,
  getMarketplaceSeller,
  getSimilarMarketplaceListings,
  getPublicMarketplaceListings,
} from "@/services/listings/marketplace-listings";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { getSellerTrustSummary } from "@/services/profile/profile-trust";
import { getListingPriceHistory } from "@/services/listings/listing-price-history";
import { MarketAnalysisInfo } from "@/components/listings/market-analysis-info";
import { PriceHistoryInfo } from "@/components/listings/price-history-info";
import { getSellerRatingSummary } from "@/services/profile/seller-reviews";
import { SellerCard } from "@/components/listings/seller-card";

interface ListingDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
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

  const seller = await getMarketplaceSeller(listing.sellerId);
  const [similarListings, trustSummary, priceHistory, ratingSummary] = await Promise.all([
    getSimilarMarketplaceListings(listing.slug, listing.brand, listing.city),
    getSellerTrustSummary(seller, (await getPublicMarketplaceListings()).listings.filter(l => l.sellerId === listing.sellerId).length),
    getListingPriceHistory(listing.id),
    getSellerRatingSummary(listing.sellerId),
  ]);
  const insight = getListingCardInsights(listing);
  const currentUser = await getCurrentUser();

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
          sellerId={listing.sellerId}
          price={listing.price}
          title={listing.title}
          seller={seller}
          trustSummary={trustSummary}
          isLoggedIn={!!currentUser}
          loginUrl={`/login?callbackUrl=${encodeURIComponent(`/listing/${listing.slug}`)}`}
          ratingSummary={ratingSummary}
      />

      <main className="min-h-screen bg-white" role="main">
        {/* Navigation & Desktop Back Button */}
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between mb-8">
              <Link href="/listings" className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all italic">
                 <div className="size-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                 </div>
                 Geri Dön
              </Link>
              <div className="flex items-center gap-3">
                 <ShareButton title={`${listing.brand} ${listing.model} - ${listing.title}`} price={listing.price} />
                 <FavoriteButton listingId={listing.id} className="h-11 px-6 rounded-2xl border border-slate-100 bg-white font-black text-[11px] uppercase tracking-widest italic" />
              </div>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            
            {/* Left Column: Multi-Media & Primary Content */}
            <div className="flex-1 min-w-0 w-full space-y-12">
              
              {/* Image Gallery */}
              <div className="rounded-[48px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-slate-100 bg-slate-50">
                 <ListingGallery images={listing.images} title={listing.title} />
              </div>

              {/* Mobile Only: Title & Price */}
              <div className="lg:hidden space-y-6">
                 <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 font-heading leading-none">
                       {listing.brand} <span className="text-slate-400">{listing.model}</span>
                    </h1>
                    {listing.carTrim && <p className="text-xl font-bold text-slate-400 uppercase tracking-tighter italic">{listing.carTrim}</p>}
                 </div>
                 <div className="flex items-center justify-between border-y border-slate-50 py-6">
                    <div className="text-4xl font-black text-slate-900 tracking-tighter font-heading">
                      ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                    </div>
                    <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
                 </div>
              </div>

              {/* Expert Inspection - High Visibility */}
              <ExpertInspectionCard expertInspection={listing.expertInspection} />

              {/* Market Analysis View: Combining AI Insight & Market Value */}
              <div className="grid md:grid-cols-2 gap-8">
                 {/* AI Assessment */}
                 <div className="space-y-8">
                    <div className="p-10 rounded-[48px] bg-slate-900 text-white space-y-8 shadow-2xl shadow-indigo-500/10">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-indigo-500 flex items-center justify-center">
                             <Sparkles size={18} className="fill-white" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic leading-none">AI Insight</span>
                             <span className="text-lg font-black font-heading leading-tight">OtoBurada Akıllı Analiz</span>
                          </div>
                       </div>
                       <p className="text-base font-medium leading-relaxed italic text-slate-300 antialiased">{insight.summary}</p>
                       <div className="flex flex-wrap gap-2 pt-2">
                          {insight.highlights.map(h => (
                            <div key={h} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/5 text-xs font-black uppercase tracking-widest italic antialiased">
                               <CheckCircle2 className="text-emerald-400" size={14} />
                               {h}
                            </div>
                          ))}
                       </div>
                    </div>
                    <MarketAnalysisInfo />
                 </div>

                 <div className="space-y-8">
                    <MarketValueCard price={listing.price} marketPriceIndex={listing.marketPriceIndex ?? 1.0} />
                    <PriceHistoryInfo history={priceHistory} currentPrice={listing.price} />
                 </div>
              </div>

              {/* Technical Tabs or Groups */}
              <div className="space-y-8">
                 <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tight font-heading">Araç Bilgileri</h2>
                    <div className="h-px flex-1 bg-slate-50" />
                 </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SpecDetailItem icon={<CalendarDays size={20} />} label="Model Yılı" value={listing.year} />
                    <SpecDetailItem icon={<CircleGauge size={20} />} label="Kilometre" value={`${formatNumber(listing.mileage)} km`} />
                    <SpecDetailItem icon={<Fuel size={20} />} label="Yakıt Tipi" value={listing.fuelType} className="capitalize" />
                    <SpecDetailItem icon={<Settings2 size={20} />} label="Vites Tipi" value={listing.transmission} className="capitalize" />
                 </div>
              </div>

              {/* Damage & Tramer Report */}
              <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />

              {/* Description */}
              <section className="p-10 rounded-[48px] bg-slate-50 border border-slate-100 space-y-8">
                 <h2 className="text-2xl font-black tracking-tight font-heading">İlan Açıklaması</h2>
                 <div className="text-lg text-slate-700 leading-loose whitespace-pre-wrap font-medium font-serif italic antialiased">
                    {listing.description}
                 </div>
              </section>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <section className="space-y-8">
                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black tracking-tight font-heading">Benzer İlanlar</h2>
                     <Link href="/listings" className="text-[11px] font-black uppercase tracking-widest text-primary italic">Hepsini Gör</Link>
                   </div>
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                     {similarListings.map((item) => (
                       <CarCard key={item.id} listing={item} />
                     ))}
                   </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Lead Capture & Seller Info */}
            <aside className="w-full lg:w-[440px] shrink-0 space-y-8 lg:sticky lg:top-8">
              
              {/* Main Desktop Action Card */}
              <div className="hidden lg:block p-10 rounded-[48px] bg-white border border-slate-100 card-shadow space-y-8">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest italic mb-2">
                       <ShieldCheck size={14} />
                       GÜVENLİ İLAN
                    </div>
                    <h1 className="text-[44px] font-black tracking-tight leading-[0.9] font-heading text-slate-900 mb-4">
                       {listing.brand} <br />
                       <span className="text-slate-300">{listing.model}</span>
                    </h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed">{listing.title}</p>
                 </div>
                 
                 <div className="border-t border-slate-50 pt-8 pb-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">İlan Fiyatı</span>
                       <div className="text-6xl font-black text-slate-900 tracking-[ -0.05em] font-heading leading-none">
                          ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                       </div>
                    </div>
                 </div>

                 <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />

                 <div className="pt-4 space-y-4">
                    <ContactActions listingId={listing.id} sellerId={listing.sellerId} />
                    <CompareButton 
                      listingId={listing.id} 
                      className="w-full h-14 rounded-2xl bg-slate-50 font-black text-[11px] text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-3 uppercase tracking-widest italic"
                    />
                 </div>
              </div>

              {/* Seller Trust Profile */}
              <SellerCard 
                seller={seller}
                trustSummary={trustSummary}
                isLoggedIn={!!currentUser}
                listingId={listing.id}
                loginUrl={`/login?callbackUrl=/listing/${listing.slug}`}
                ratingSummary={ratingSummary}
              />

              <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100/50 flex gap-4">
                 <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                 <p className="text-[10px] text-amber-900 font-black leading-relaxed italic uppercase tracking-tighter">
                    Dikkat: Aracı görmeden veya noter evrakı imzalamadan ödeme yapmayınız.
                 </p>
              </div>

              <div className="flex flex-col gap-3">
                 <ReportListingForm listingId={listing.id} sellerId={listing.sellerId} userId={currentUser?.id ?? null} />
                 <ListingPrintAction />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function SpecDetailItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string | number, className?: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-100 flex flex-col gap-3 group hover:border-primary/20 transition-all duration-300">
       <div className="size-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-all">
          {icon}
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic leading-none mb-1">{label}</span>
          <span className={cn("text-base font-black font-heading text-slate-900", className)}>{value}</span>
       </div>
    </div>
  )
}
