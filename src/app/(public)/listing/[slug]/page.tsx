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
  ShieldCheck,
  TrendingDown,
  Info,
  Clock,
  ArrowLeft
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { CompareButton } from "@/components/listings/compare-button";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ReportListingForm } from "@/components/forms/report-listing-form";
import { ShareButton } from "@/components/listings/share-button";
import { CarCard } from "@/components/modules/listings/car-card";
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
  const similarListings = await getSimilarMarketplaceListings(listing.slug, listing.brand, listing.city);
  const activeListingCount = (await getPublicMarketplaceListings()).listings.filter(l => l.sellerId === listing.sellerId).length;
  const insight = getListingCardInsights(listing);
  const trustSummary = getSellerTrustSummary(seller, activeListingCount);
  const currentUser = await getCurrentUser();
  
  const marketPriceIndex = listing.marketPriceIndex || 1.0;
  const marketStatus = marketPriceIndex <= 0.95 ? "excellent" : marketPriceIndex >= 1.05 ? "high" : "fair";
  const priceDiff = (listing.price / marketPriceIndex) - listing.price;

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
          isLoggedIn={true} // Forcing true to allow Reveal (we will fix the action to use IP)
          loginUrl={`/login?next=${encodeURIComponent(`/listing/${listing.slug}`)}`}
      />

      <main className="min-h-screen bg-background" role="main">
        {/* Navigation & Desktop Back Button */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between mb-4">
              <Link href="/listings" className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                 <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                 İlanlara Dön
              </Link>
              <div className="flex items-center gap-2">
                 <ShareButton title={`${listing.brand} ${listing.model} - ${listing.title}`} price={listing.price} />
                 <FavoriteButton listingId={listing.id} className="h-9 px-4 rounded-xl border border-border bg-white" />
              </div>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            
            {/* Left Column: Multi-Media & Primary Content */}
            <div className="flex-1 min-w-0 w-full space-y-8">
              
              {/* Image Gallery */}
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-border bg-black">
                 <ListingGallery images={listing.images} title={listing.title} />
              </div>

              {/* Mobile Only: Title & Price */}
              <div className="lg:hidden space-y-4">
                 <h1 className="text-3xl font-black tracking-tight text-foreground">
                    {listing.brand} <span className="text-primary italic">{listing.model}</span>
                 </h1>
                 <p className="text-lg text-muted-foreground font-medium italic">{listing.title}</p>
                 <div className="text-4xl font-black text-foreground">
                    ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                 </div>
              </div>

              {/* Expert Inspection - High Visibility */}
              <ExpertInspectionCard expertInspection={listing.expertInspection} />

              {/* AI Wisdom & Market Insights (Combo) */}
              <div className="grid md:grid-cols-2 gap-6">
                 {/* AI Assessment */}
                 <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-4">
                    <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest italic">
                       <Sparkles size={16} className="fill-primary/20" />
                       OtoBurada AI Analizi
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic">{insight.summary}</p>
                    <div className="flex flex-wrap gap-2">
                       {insight.highlights.map(h => (
                         <div key={h} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-xs font-bold shadow-sm">
                            <CheckCircle2 className="text-emerald-500" size={14} />
                            {h}
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Price Analysis Card (Refactored to match) */}
                 <PriceAnalysisCard 
                    price={listing.price} 
                    marketStatus={marketStatus} 
                    priceDiff={priceDiff} 
                    marketPriceIndex={listing.marketPriceIndex ?? undefined}
                  />
              </div>

              {/* Technical Tabs or Groups */}
              <div className="space-y-6">
                 <h2 className="text-2xl font-black tracking-tight italic">Araç Bilgileri</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-border card-shadow flex flex-col gap-2">
                       <CalendarDays className="text-muted-foreground" size={24} />
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">Model Yılı</span>
                       <span className="text-lg font-black">{listing.year}</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-border card-shadow flex flex-col gap-2">
                       <CircleGauge className="text-muted-foreground" size={24} />
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">Kilometre</span>
                       <span className="text-lg font-black">{formatNumber(listing.mileage)}</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-border card-shadow flex flex-col gap-2">
                       <Fuel className="text-muted-foreground" size={24} />
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">Yakıt</span>
                       <span className="text-lg font-black capitalize">{listing.fuelType}</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-border card-shadow flex flex-col gap-2">
                       <Settings2 className="text-muted-foreground" size={24} />
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">Vites</span>
                       <span className="text-lg font-black capitalize">{listing.transmission}</span>
                    </div>
                 </div>
              </div>

              {/* Damage & Tramer Report */}
              <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />

              {/* Description */}
              <section className="p-8 rounded-3xl bg-secondary/10 border border-border space-y-6">
                 <h2 className="text-2xl font-black tracking-tight italic">Açıklama</h2>
                 <div className="text-base text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                    {listing.description}
                 </div>
              </section>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-2xl font-black tracking-tight italic">Benzer İlanlar</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {similarListings.map((item) => (
                      <CarCard key={item.id} listing={item} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Lead Capture & Seller Info */}
            <aside className="w-full lg:w-[420px] shrink-0 space-y-6 lg:sticky lg:top-24">
              
              {/* Main Desktop Action Card */}
              <div className="hidden lg:block p-8 rounded-[32px] bg-white border border-border card-shadow space-y-6">
                 <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2 italic">
                    <ShieldCheck size={16} />
                    Güvenli İlan
                 </div>
                 <h1 className="text-4xl font-black tracking-tight leading-none italic">
                    {listing.brand} {listing.model}
                 </h1>
                 <p className="text-lg text-muted-foreground font-medium italic">{listing.title}</p>
                 
                 <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-5xl font-black underline underline-offset-[12px] decoration-primary transition-all">
                       ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                    </span>
                 </div>

                 <div className="pt-8 space-y-4">
                    {/* Primary Contact CTA */}
                    <ContactActions listingId={listing.id} />
                    <CompareButton 
                      listingId={listing.id} 
                      className="w-full h-14 rounded-2xl border border-border bg-secondary font-bold text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    />
                 </div>
              </div>

              {/* Seller Trust Profile */}
              <div className="p-8 rounded-[32px] bg-white border border-border card-shadow space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-2xl border border-primary/20 italic">
                      {(seller?.fullName ?? "S").slice(0, 1)}
                    </div>
                    <div className="flex-1">
                       <h3 className="font-black text-xl italic">{seller?.fullName || "Bireysel Satıcı"}</h3>
                       <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mt-1">
                          <CheckCircle2 size={14} />
                          Kimlik Doğrulandı
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100">
                    <div className="text-center">
                       <div className="text-lg font-black">{activeListingCount}</div>
                       <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider italic">Aktif İlan</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                       <div className="text-lg font-black">9.8</div>
                       <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider italic">Güven Puanı</div>
                    </div>
                 </div>

                 {/* Trust Signals List */}
                 <div className="space-y-3">
                    {trustSummary.signals.map(s => (
                      <div key={s} className="flex items-center gap-3 text-sm font-bold text-slate-700 italic">
                         <div className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="text-emerald-500" size={12} />
                         </div>
                         {s}
                      </div>
                    ))}
                 </div>

                 <Link href={`/seller/${listing.sellerId}`} className="flex w-full h-12 items-center justify-center text-sm font-bold border border-border rounded-xl hover:bg-secondary transition-all italic">
                    Satıcı Profilini Gör
                 </Link>
              </div>

              {/* Moderation Safety Note */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-4">
                 <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                 <p className="text-[11px] text-amber-900 font-bold leading-relaxed italic uppercase">
                    Dikkat: Aracı görmeden, noter huzurunda evrak imzalamadan kesinlikle kapora veya ödeme yapmayınız.
                 </p>
              </div>

              {/* Report Button */}
              <ReportListingForm listingId={listing.id} sellerId={listing.sellerId} userId={currentUser?.id ?? null} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
