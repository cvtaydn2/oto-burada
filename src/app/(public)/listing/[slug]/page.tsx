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
          isLoggedIn={!!currentUser}
          loginUrl={`/login?callbackUrl=${encodeURIComponent(`/listing/${listing.slug}`)}`}
      />

      <main className="min-h-screen" role="main">
        {/* Navigation & Desktop Back Button */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between mb-8">
              <Link href="/listings" className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all italic">
                 <div className="size-8 rounded-full border border-border/40 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                 </div>
                 İLANLARA DÖN
              </Link>
              <div className="flex items-center gap-3">
                 <ShareButton title={`${listing.brand} ${listing.model} - ${listing.title}`} price={listing.price} />
                 <FavoriteButton listingId={listing.id} className="h-11 px-6 rounded-2xl border border-border/40 bg-white font-black text-[11px] uppercase tracking-widest italic hover:bg-secondary/50 transition-all" />
              </div>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            
            {/* Left Column: Multi-Media & Primary Content */}
            <div className="flex-1 min-w-0 w-full space-y-12">
              
              {/* Image Gallery - Showroom Frame */}
              <div className="rounded-[40px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white/20 bg-card ring-1 ring-black/5">
                 <ListingGallery images={listing.images} title={listing.title} />
              </div>

              {/* Mobile Only Header */}
              <div className="lg:hidden space-y-6">
                 <div className="space-y-2">
                    <div className="text-[11px] font-black text-primary uppercase tracking-[0.2em] italic mb-1">
                      {listing.brand}
                    </div>
                    <h1 className="text-4xl font-black tracking-tightest text-foreground font-heading leading-[0.9]">
                       {listing.model}
                    </h1>
                    {listing.carTrim && <p className="text-lg font-black text-muted-foreground uppercase tracking-tighter italic">{listing.carTrim}</p>}
                 </div>
                 <div className="flex items-center justify-between border-y border-border/40 py-6">
                    <div className="text-4xl font-black text-primary tracking-tightest font-heading italic">
                      ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                    </div>
                    <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
                 </div>
              </div>

              {/* Expert Inspection - High Visibility */}
              <div className="showroom-card rounded-[32px] overflow-hidden">
                <ExpertInspectionCard expertInspection={listing.expertInspection} />
              </div>

              {/* Market Analysis View */}
              <div className="grid md:grid-cols-2 gap-8">
                 {/* AI Assessment */}
                 <div className="space-y-8">
                    <div className="p-10 rounded-[40px] bg-[#05070A] text-white space-y-8 shadow-2xl shadow-primary/10 border border-white/5 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                          <Sparkles size={120} />
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                             <Sparkles size={18} className="fill-white" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic leading-none mb-1">DİJİTAL ASİSTAN</span>
                             <span className="text-xl font-black font-heading leading-tight tracking-tight">Showroom Analizi</span>
                          </div>
                       </div>
                       <p className="text-lg font-medium leading-relaxed italic text-white/70 antialiased relative z-10">{insight.summary}</p>
                       <div className="flex flex-wrap gap-2 pt-2 relative z-10">
                          {insight.highlights.map(h => (
                            <div key={h} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest italic antialiased text-white/90">
                               <CheckCircle2 className="text-primary" size={14} />
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

              {/* Technical Specifications */}
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black tracking-tightest font-heading uppercase italic">Dosya Detayları</h2>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-border/40 to-transparent" />
                 </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SpecDetailItem icon={<CalendarDays size={20} />} label="Model Yılı" value={listing.year} />
                    <SpecDetailItem icon={<CircleGauge size={20} />} label="Mesafe" value={`${formatNumber(listing.mileage)} km`} />
                    <SpecDetailItem icon={<Fuel size={20} />} label="Yakıt" value={listing.fuelType} className="capitalize" />
                    <SpecDetailItem icon={<Settings2 size={20} />} label="Şanzıman" value={listing.transmission} className="capitalize" />
                 </div>
              </div>

              {/* Damage & Tramer Report */}
              <div className="showroom-card rounded-[32px] overflow-hidden">
                <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />
              </div>

              {/* Description */}
              <section className="p-10 lg:p-14 rounded-[48px] bg-card border border-border/40 space-y-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck size={180} />
                 </div>
                 <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic mb-1">SATICI NOTU</span>
                    <h2 className="text-3xl font-black tracking-tightest font-heading uppercase">Açıklama</h2>
                 </div>
                 <div className="text-xl text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium font-serif italic antialiased max-w-4xl">
                    {listing.description}
                 </div>
              </section>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <section className="space-y-8 pt-12">
                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-black tracking-tightest font-heading uppercase italic">Benzer Seviyedeki Araçlar</h2>
                     <Link href="/listings" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic border-b-2 border-primary/20 hover:border-primary transition-all pb-1">TÜMÜNÜ İNCELE</Link>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {similarListings.map((item) => (
                       <CarCard key={item.id} listing={item} />
                     ))}
                   </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Lead Capture & Seller Info */}
            <aside className="w-full lg:w-[460px] shrink-0 space-y-8 lg:sticky lg:top-28">
              
              {/* Main Desktop Action Card */}
              <div className="hidden lg:block p-10 rounded-[48px] bg-card border border-border/40 shadow-2xl space-y-10 ring-1 ring-black/5">
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] italic">
                       <ShieldCheck size={16} />
                       ONAYLI SHOWROOM İLANI
                    </div>
                    <div className="space-y-1">
                      <div className="text-[14px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">
                        {listing.brand}
                      </div>
                      <h1 className="text-[52px] font-black tracking-tightest leading-[0.8] font-heading text-foreground uppercase italic underline decoration-primary/20 decoration-8 underline-offset-[12px]">
                         {listing.model}
                      </h1>
                    </div>
                    <p className="text-[12px] text-muted-foreground/60 font-bold uppercase tracking-widest italic leading-relaxed pt-4">{listing.title}</p>
                 </div>
                 
                 <div className="pt-8 border-t border-border/40">
                    <div className="flex flex-col gap-1">
                       <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] italic mb-1">TEKLİF FİYATI</span>
                       <div className="text-6xl font-black text-primary tracking-tightest font-heading italic">
                          ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                       </div>
                    </div>
                 </div>

                 <div className="bg-secondary/50 rounded-2xl p-4 flex items-center justify-between">
                    <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
                    <div className="h-6 w-px bg-border/40" />
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                      ID: #{listing.id.slice(0, 8).toUpperCase()}
                    </div>
                 </div>

                 <div className="pt-4 space-y-5">
                    <ContactActions listingId={listing.id} sellerId={listing.sellerId} />
                    <CompareButton 
                      listingId={listing.id} 
                      className="w-full h-16 rounded-[24px] bg-secondary font-black text-[11px] text-foreground hover:bg-secondary/80 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] italic border border-border/40"
                    />
                 </div>
              </div>

              {/* Seller Trust Profile */}
              <div className="showroom-card rounded-[40px] overflow-hidden">
                <SellerCard 
                  seller={seller}
                  trustSummary={trustSummary}
                  isLoggedIn={!!currentUser}
                  listingId={listing.id}
                  loginUrl={`/login?callbackUrl=/listing/${listing.slug}`}
                  ratingSummary={ratingSummary}
                />
              </div>

              <div className="p-8 rounded-[32px] bg-accent/5 border border-accent/20 flex gap-5">
                 <AlertTriangle size={24} className="text-accent shrink-0" />
                 <p className="text-[11px] text-accent font-black leading-relaxed italic uppercase tracking-tighter">
                    GÜVENLİK UYARISI: ARACI GÖRMEDEN, NOTER HUZURUNDA İMZA ATMADAN HİÇBİR ŞEKİLDE KAPORA VEYA ÖDEME GÖNDERMEYİNİZ.
                 </p>
              </div>

              <div className="flex flex-col gap-4">
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
    <div className="p-8 rounded-[32px] bg-card border border-border/40 flex flex-col gap-4 group hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
       <div className="size-12 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
          {icon}
       </div>
       <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic leading-none mb-1">{label}</span>
          <span className={cn("text-lg font-black font-heading text-foreground uppercase tracking-tight", className)}>{value}</span>
       </div>
    </div>
  )
}
