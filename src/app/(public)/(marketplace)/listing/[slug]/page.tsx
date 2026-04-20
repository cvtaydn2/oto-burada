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
import { getMemberSinceYear, getMembershipYears } from "@/lib/utils/listing-utils";
import { listingDetail, breadcrumbs as breadcrumbLabels } from "@/lib/constants/ui-strings";

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
  () => import("@/components/listings/mobile-sticky-actions").then((mod) => mod.MobileStickyActions)
);

const SafeWhatsAppButton = dynamic(
  () => import("@/components/listings/safe-whatsapp-button").then((mod) => mod.SafeWhatsAppButton)
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

  const headersList = await headers();
  const viewerIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? headersList.get("x-real-ip")
    ?? undefined;

  recordListingView(listing.id, {
    viewerId: currentUser?.id,
    viewerIp,
  }).catch(() => {});

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

      <main className="min-h-screen bg-background flex flex-col">
        <div className="mx-auto max-w-[1400px] px-6 py-10 w-full flex-1">
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
            <nav className="flex flex-wrap items-center gap-3">
              {pageBreadcrumbs.map((b, i) => (
                <div key={b.url} className="flex items-center gap-3">
                  <Link href={b.url} className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-all hover:text-primary",
                    i === pageBreadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {b.name}
                  </Link>
                  {i < pageBreadcrumbs.length - 1 && (
                    <div className="size-1 rounded-full bg-border" />
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
            
            <div className="w-full min-w-0 flex-1 space-y-10">
                           <div className="relative group">
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/40 bg-muted">
                    <ListingGallery images={listing.images} title={listing.title} />
                    
                    <div className="absolute left-8 top-8 z-20 flex flex-col gap-3">
                      {listing.featured && (
                        <div className="bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-border/10">
                          <Zap size={14} className="text-primary animate-pulse" />
                          ÖNE ÇIKAN İLAN
                        </div>
                      )}
                      {listing.expertInspection && (
                        <div className="bg-card text-foreground text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg border border-border flex items-center gap-2">
                          <ShieldCheck size={14} className="text-primary" />
                          EKSPERTİZ ONAYLI
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-10 border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative overflow-hidden group">
                <div className="space-y-6 relative z-10 w-full">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none">{listing.brand}</span>
                       <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none">{listing.year} MODELL</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-[1.1] tracking-tighter">
                      {listing.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted rounded-xl">
                        <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <span className="leading-none">{listing.city}, {listing.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-muted rounded-xl">
                        <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <span className="leading-none">{new Date(listing.createdAt).toLocaleDateString("tr-TR")} GÜNCELLENDİ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted rounded-xl">
                        <Zap size={14} className="text-muted-foreground" />
                      </div>
                      <span className="leading-none">İLAN NO: {listing.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <ViewCounter listingId={listing.id} initialCount={listing.viewCount} />
                  </div>
                </div>

                <div className="text-left md:text-right w-full md:w-auto relative z-10">
                  <div className="text-5xl md:text-6xl font-bold text-foreground tracking-tighter mb-1">
                    {new Intl.NumberFormat("tr-TR").format(listing.price)}<span className="text-2xl ml-1 text-muted-foreground/40 font-medium">TL</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">RESMİ SATIŞ FİYATI</p>
                </div>
              </div>

              <ListingSpecs listing={listing} />

              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm relative group overflow-hidden">
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-8 relative">{listingDetail.trustSummary}</h2>
                <TrustSummary 
                  listing={listing} 
                  seller={seller} 
                  updatedAt={listing.updatedAt} 
                />
              </div>

              <div id="ekspertiz" className="scroll-mt-24 space-y-10">
                <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="flex items-center gap-4 text-xl font-bold text-foreground tracking-tight">
                      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      Ekspertiz Raporu
                    </h2>
                    {listing.expertInspection?.documentUrl && (
                      <a
                        href={listing.expertInspection.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl bg-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm hover:opacity-90 transition-all"
                      >
                        PDF RAPORU GÖRÜNTÜLE
                      </a>
                    )}
                  </div>
                  <ExpertInspectionCard expertInspection={listing.expertInspection} />
                </div>

                <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                  <h2 className="mb-8 flex items-center gap-4 text-xl font-bold text-foreground tracking-tight">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Zap size={24} />
                    </div>
                    Kaporta & Boya Durumu
                  </h2>
                  <DamageReportCard damageStatus={listing.damageStatusJson} tramerAmount={listing.tramerAmount} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm relative overflow-hidden group">
                <h2 className="mb-8 flex items-center gap-4 text-xl font-bold text-foreground tracking-tight relative">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  Piyasa Analizi
                </h2>
                <div className="grid gap-10 lg:grid-cols-2 relative lg:items-center">
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-muted border border-border/40 italic font-medium text-foreground/70 leading-relaxed relative">
                       <div className="absolute -top-3 left-6 px-3 py-1 bg-card border border-border/40 rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Yapay Zeka Özeti</div>
                       &ldquo;{insight.summary}&rdquo;
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {insight.highlights.map(h => (
                        <div key={h} className="rounded-xl bg-card border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                  <MarketValueCard listing={listing} />
                </div>
              </div>

              {priceHistory.length >= 2 && (
                <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                  <h2 className="mb-8 flex items-center gap-4 text-xl font-bold text-foreground tracking-tight">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <TrendingUp size={24} />
                    </div>
                    Fiyat Değişim Trendi
                  </h2>
                  <PriceHistoryChart history={priceHistory} currentPrice={listing.price} />
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-foreground tracking-tight">İlan Hakkında</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-base leading-loose text-foreground/80 font-medium whitespace-pre-wrap">{listing.description}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm" style={{ isolation: "isolate" }}>
                <h2 className="mb-8 flex items-center gap-4 text-xl font-bold text-foreground tracking-tight">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <ChevronRight size={24} className="rotate-90" />
                  </div>
                  Gerçek Konum
                </h2>
                <div className="rounded-2xl overflow-hidden border border-border/40">
                   <ListingMap city={listing.city} district={listing.district} className="h-80" />
                </div>
              </div>

              {similarListings.length > 0 && (
                <div className="pt-10 border-t border-border/50">
                  <h2 className="mb-10 text-3xl font-bold text-foreground tracking-tighter">Sizin İçin Seçtiklerimiz</h2>
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {similarListings.map((item, index) => (
                      <CarCard key={item.id} listing={item} priority={index < 2} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="w-full lg:w-96 flex-shrink-0 space-y-8 lg:sticky lg:top-24">
              
              <div className="bg-card border border-border rounded-2xl p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">İLAN SAHİBİ</h2>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">{seller?.userType === "professional" ? "Kurumsal Galeri" : "Bireysel Satıcı"}</p>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="relative size-16 rounded-xl border-2 border-muted shadow-sm bg-card overflow-hidden flex items-center justify-center">
                        {seller?.businessLogoUrl ? (
                          <Image src={seller.businessLogoUrl} alt={seller.fullName || ""} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="size-full bg-muted flex items-center justify-center font-bold text-xl text-muted-foreground/30">
                             {seller?.fullName?.[0] || "S"}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-0.5 bg-card rounded-full">
                        <div className="size-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground truncate tracking-tight">{seller?.businessName || seller?.fullName}</h3>
                        {seller?.verifiedBusiness && (
                          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm" title="Doğrulanmış İşletme">
                            <ShieldCheck size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {seller?.isVerified && (
                           <div className="bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-primary/20">ONAYLI ÜYE</div>
                        )}
                        {membershipYears !== null && <span className="text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-widest">EST. {memberSince}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ContactActions listingId={listing.id} listingSlug={listing.slug} sellerId={listing.sellerId} currentUserId={currentUser?.id ?? null} />
                  </div>

                  {sellerRatingSummary.count > 0 && (
                    <div className="pt-8 border-t border-border/50">
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">MEMNUNİYET</span>
                         <span className="text-lg font-bold text-foreground tracking-tighter">{sellerRatingSummary.average.toFixed(1)}/5.0</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className={cn(
                            "h-1.5 flex-1 rounded-full",
                            star <= Math.round(sellerRatingSummary.average) ? "bg-amber-400" : "bg-muted"
                          )} />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 font-semibold uppercase tracking-widest text-center">{sellerRatingSummary.count} DEĞERLENDİRME</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-border/50 space-y-4">
                    <Link href={seller?.businessSlug ? `/gallery/${seller.businessSlug}` : `/seller/${listing.sellerId}`} className="flex justify-between items-center group/link">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover/link:text-primary transition-colors">TÜM İLANLARI</span>
                      <ChevronRight size={14} className="text-muted-foreground transition-all group-hover/link:translate-x-1" />
                    </Link>
                    <Link href="#ekspertiz" className="flex justify-between items-center group/link">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover/link:text-primary transition-colors">RANDEVU OLUŞTUR</span>
                      <ChevronRight size={14} className="text-muted-foreground transition-all group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 lg:p-8 border border-primary/10 relative overflow-hidden group">
                <div className="relative z-10 space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold tracking-tight text-foreground">Hızlı Teklif</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none">WhatsApp ile anında ulaş</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <SafeWhatsAppButton 
                      listingId={listing.id}
                      listingTitle={listing.title}
                      offerPrice={Math.round(listing.price * 0.95)}
                      variant="outline"
                      label={`₺${new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.95))} (%5 Teklif)`}
                    />
                    <SafeWhatsAppButton 
                      listingId={listing.id}
                      listingTitle={listing.title}
                      offerPrice={Math.round(listing.price * 0.98)}
                      variant="outline"
                      label={`₺${new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.98))} (%2 Teklif)`}
                    />
                  </div>
                  
                  <SafeWhatsAppButton 
                    listingId={listing.id}
                    listingTitle={listing.title}
                    label="KENDİ TEKLİFİNİ YAP"
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-500" />
                   GÜVENLİK ÖNERİLERİ
                </h3>
                <div className="space-y-4">
                   {[
                     "Aracı görmeden kapora göndermeyiniz.",
                     "Resmi ekspertiz raporu talep ediniz.",
                     "Ödemeyi resmi kanallarla yapınız."
                   ].map(tip => (
                     <div key={tip} className="flex gap-3 items-start">
                        <div className="size-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        <p className="text-xs font-medium text-muted-foreground leading-snug">{tip}</p>
                     </div>
                   ))}
                </div>
                <div className="mt-8 pt-6 border-t border-border">
                  <Link href="/support" className="flex items-center gap-3 text-muted-foreground hover:text-rose-500 transition-colors group/report">
                    <div className="size-9 rounded-xl bg-muted group-hover/report:bg-rose-50 flex items-center justify-center transition-colors">
                       <XCircle size={14} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">İLAN BİLDİR</span>
                  </Link>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 p-4 backdrop-blur-lg md:hidden animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">İlan Fiyatı</div>
            <div className="truncate text-lg font-bold tracking-tight text-foreground">
              {listing.price.toLocaleString("tr-TR")} ₺
            </div>
          </div>
          <SafeWhatsAppButton 
            listingId={listing.id}
            listingTitle={listing.title}
            className="h-12 flex-[1.5] bg-[#25D366] text-xs shadow-emerald-500/20"
            label="WhatsApp"
          />
        </div>
      </div>

    </>
  );
}
