import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Fuel,
  Settings2,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Zap
} from "lucide-react";

import { FavoriteButton } from "@/components/listings/favorite-button";
import { CompareButton } from "@/components/listings/compare-button";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { ShareButton } from "@/components/listings/share-button";
import { CarCard } from "@/components/modules/listings/car-card";
import { ContactActions } from "@/components/listings/contact-actions";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
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
import { getSellerRatingSummary } from "@/services/profile/seller-reviews";

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

      <main className="min-h-screen bg-[#FDFDFF] pt-24" role="main">
        {/* Navigation & Desktop Top Bar */}
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 mb-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <nav className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
                <span>/</span>
                <Link href="/listings" className="hover:text-primary">Otomobil</Link>
                <span>/</span>
                <Link href={`/listings?brand=${listing.brand}`} className="hover:text-primary">{listing.brand}</Link>
                <span>/</span>
                <span className="text-slate-900 truncate max-w-[150px]">{listing.model}</span>
              </nav>
              
              <div className="flex items-center gap-3">
                 <ShareButton title={`${listing.brand} ${listing.model}`} price={listing.price} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 gap-2" />
                 <CompareButton listingId={listing.id} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 gap-2" />
                 <FavoriteButton listingId={listing.id} className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:text-primary transition-all" />
              </div>
           </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pb-32">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            
            {/* Left Column (70%) */}
            <div className="flex-1 min-w-0 w-full space-y-10">
              
              {/* Image Gallery Side */}
              <div className="space-y-6">
                <div className="relative rounded-[32px] overflow-hidden bg-slate-100 aspect-[16/10] lg:aspect-[16/9] shadow-2xl">
                   <ListingGallery images={listing.images} title={listing.title} />
                   
                   {/* Badges Overlay */}
                   <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                      <div className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Öne Çıkan İlan</div>
                      <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                        <ShieldCheck size={12} className="text-primary" />
                        Ekspertiz Onaylı
                      </div>
                   </div>

                   {/* 360 View Placeholder */}
                   <button className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl transition-all active:scale-95 z-10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20M5.3 5.3l13.4 13.4M5.3 18.7l13.4-13.4"/></svg>
                      360° Görünüm
                   </button>
                </div>
              </div>

              {/* Title & Price Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
                 <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tightest leading-tight">
                       {listing.brand} {listing.model} <span className="text-slate-400 font-medium">{listing.carTrim}</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400">
                       <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          {listing.city}, {listing.district}
                       </span>
                       <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {new Date(listing.createdAt).toLocaleDateString('tr-TR')} güncellendi
                       </span>
                       <span className="bg-slate-50 px-3 py-1 rounded-lg">İlan No: {listing.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-4xl lg:text-5xl font-black text-primary tracking-tightest">
                       ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Son güncelleme: 15 Mayıs 2024</p>
                 </div>
              </div>

              {/* Key Specs Grid (4 boxes) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-primary/20 transition-all">
                    <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                       <CalendarDays size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MODEL YILI</span>
                       <span className="text-base font-black text-slate-900">{listing.year}</span>
                    </div>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-primary/20 transition-all">
                    <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm">
                       <CircleGauge size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">KİLOMETRE</span>
                       <span className="text-base font-black text-slate-900">{formatNumber(listing.mileage)} km</span>
                    </div>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-primary/20 transition-all">
                    <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-teal-500 shadow-sm">
                       <Fuel size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">YAKIT TİPİ</span>
                       <span className="text-base font-black text-slate-900 capitalize">{listing.fuelType}</span>
                    </div>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-primary/20 transition-all">
                    <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                       <Settings2 size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">VİTES TİPİ</span>
                       <span className="text-base font-black text-slate-900 capitalize">{listing.transmission}</span>
                    </div>
                 </div>
              </div>

              {/* Expert Inspection - Detailed Section */}
              <div id="ekspertiz" className="space-y-6 pt-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                       <ShieldCheck className="text-primary" />
                       Ekspertiz Raporu
                    </h2>
                    <Link href="#" className="text-sm font-bold text-primary hover:underline">Tam Raporu Gör</Link>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    <ExpertInspectionCard expertInspection={listing.expertInspection} />
                    <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />
                 </div>
              </div>

              {/* Market Insights Area */}
              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                 <div className="p-8 rounded-[32px] bg-slate-900 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                       <Sparkles size={80} />
                    </div>
                    <h3 className="text-lg font-black italic mb-4">Showroom Analizi</h3>
                    <p className="text-sm text-white/70 italic leading-relaxed mb-6">{insight.summary}</p>
                    <div className="flex flex-wrap gap-2">
                       {insight.highlights.map(h => (
                         <div key={h} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                            {h}
                         </div>
                       ))}
                    </div>
                 </div>
                 <MarketValueCard price={listing.price} marketPriceIndex={listing.marketPriceIndex ?? 1.0} />
              </div>

              {/* Description Section */}
              <div className="space-y-6 pt-10">
                 <h2 className="text-2xl font-black text-slate-900">Açıklama</h2>
                 <div className="text-lg text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                    {listing.description}
                 </div>
              </div>

              {/* Similar Vehicles */}
              {similarListings.length > 0 && (
                <section className="pt-20 border-t border-slate-100">
                   <h2 className="text-2xl font-black text-slate-900 mb-10">Benzer araçlar</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {similarListings.map((item) => (
                       <CarCard key={item.id} listing={item} />
                     ))}
                   </div>
                </section>
              )}
            </div>

            {/* Right Column (30%) */}
            <aside className="w-full lg:w-[400px] shrink-0 space-y-8 lg:sticky lg:top-28">
              
              {/* Seller Information Card */}
              <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8">
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Satıcı Bilgileri</h3>
                 
                 <div className="flex items-center gap-5 pb-6 border-b border-slate-50">
                    <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-300 border border-slate-100 overflow-hidden">
                       {seller?.businessLogoUrl ? (
                          <img src={seller.businessLogoUrl} alt={seller.fullName} className="size-full object-cover" />
                       ) : (
                          seller?.fullName?.[0] || 'S'
                       )}
                    </div>
                    <div className="flex-1">
                       <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{seller?.businessName || seller?.fullName}</h4>
                       <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{seller?.userType === 'professional' ? 'Kurumsal Galeri' : 'Bireysel Satıcı'}</span>
                          <span className="size-1 rounded-full bg-slate-200" />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest italic">
                             <CheckCircle2 size={12} />
                             Onaylı Üye
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-2">
                    <ContactActions listingId={listing.id} sellerId={listing.sellerId} />
                    
                    <Link href={`/gallery/${seller?.businessSlug || seller?.id}`} className="flex items-center justify-between w-full h-14 px-6 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-all group">
                       Satıcının Diğer İlanları
                       <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
              </div>

              {/* Fast Offer Card */}
              <div className="p-8 rounded-[32px] bg-sky-50 border border-sky-100 space-y-6">
                 <div className="space-y-2">
                    <h3 className="text-lg font-black text-sky-900 flex items-center gap-2">
                       <Zap size={20} className="fill-sky-400 text-sky-400" />
                       Hızlı Teklif Ver
                    </h3>
                    <p className="text-xs font-medium text-sky-700 leading-relaxed italic">
                       Aracı beğendiniz mi? Satıcıya hızlı bir fiyat teklifi göndererek süreci başlatabilirsiniz.
                    </p>
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="flex-1 h-14 bg-white rounded-xl border border-sky-200 px-4 flex items-center justify-center font-black text-sky-900">
                       ₺3.400.000
                    </div>
                    <div className="flex-1 h-14 bg-white rounded-xl border border-sky-200 px-4 flex items-center justify-center font-black text-sky-900">
                       ₺3.425.000
                    </div>
                 </div>

                 <button className="w-full h-14 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-sky-500/20 transition-all active:scale-95">
                    Kendi Teklifini Yap
                 </button>
              </div>

              {/* Security Tips Card */}
              <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 space-y-6">
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    Güvenli Alışveriş Tüyoları
                 </h3>
                 <ul className="space-y-4">
                    {[
                      "Aracı görmeden kesinlikle kapora göndermeyin.",
                      "Ekspertiz raporunu yetkili servislerde onaylatın.",
                      "Ödemeyi noter huzurunda güvenli sistemlerle yapın."
                    ].map(tip => (
                      <li key={tip} className="flex gap-3 text-xs font-bold text-slate-500 leading-relaxed italic">
                        <span className="size-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                 </ul>
                 <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                    İlanı Şikayet Et
                 </button>
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
