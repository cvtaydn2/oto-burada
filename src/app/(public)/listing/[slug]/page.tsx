import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CircleGauge,
  Fuel,
  Settings2,
  ShieldCheck,
  ArrowLeft,
  Zap,
} from "lucide-react";

import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { CarCard } from "@/components/modules/listings/car-card";
import { ContactActions } from "@/components/listings/contact-actions";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
import { MarketValueCard } from "@/components/listings/market-value-card";
import { MobileStickyActions } from "@/components/listings/mobile-sticky-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { buildListingDetailMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { formatNumber } from "@/lib/utils";
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
  const [similarListings] = await Promise.all([
    getSimilarMarketplaceListings(listing.slug, listing.brand, listing.city),
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

      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1280px] px-5 pb-28 lg:px-6 lg:pt-8">
          
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/listings" className="hover:text-primary">Otomobil</Link>
            <span>/</span>
            <Link href={`/listings?brand=${listing.brand}`} className="hover:text-primary">{listing.brand}</Link>
            <span>/</span>
            <span className="text-slate-900 truncate max-w-[150px]">{listing.model}</span>
          </nav>

          <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-10">
            
            {/* Left Column */}
            <div className="w-full min-w-0 flex-1 space-y-8">
              
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:aspect-[16/9]">
                  <ListingGallery images={listing.images} title={listing.title} />
                  
                  {/* Badges */}
                  <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
                    {listing.featured && (
                      <span className="rounded-md bg-primary px-3 py-1 text-[10px] font-bold text-white">Öne Çıkan İlan</span>
                    )}
                    {listing.expertInspection && (
                      <span className="flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1 text-[10px] font-semibold text-slate-700 shadow">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        Ekspertiz Onaylı
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Price */}
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                    {listing.brand} {listing.model}
                    {listing.carTrim && <span className="font-semibold text-slate-500"> {listing.carTrim}</span>}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {listing.city}, {listing.district}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">İlan No: {listing.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-black text-primary md:text-4xl">
                    ₺{new Intl.NumberFormat("tr-TR").format(listing.price)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(listing.createdAt).toLocaleDateString("tr-TR")} tarihinde güncellendi</p>
                </div>
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SpecBox icon={<CalendarDays size={18} />} label="Yıl" value={String(listing.year)} />
                <SpecBox icon={<CircleGauge size={18} />} label="Kilometre" value={`${formatNumber(listing.mileage)} km`} />
                <SpecBox icon={<Fuel size={18} />} label="Yakıt" value={listing.fuelType} />
                <SpecBox icon={<Settings2 size={18} />} label="Vites" value={listing.transmission} />
              </div>

              {/* Expert Inspection */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <ShieldCheck size={20} className="text-emerald-500" />
                    Ekspertiz Raporu
                  </h2>
                  <Link href="#ekspertiz" className="text-xs font-medium text-primary hover:underline">Tam raporu gör</Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ExpertInspectionCard expertInspection={listing.expertInspection} />
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
                  <MarketValueCard price={listing.price} marketPriceIndex={listing.marketPriceIndex ?? 1.0} />
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Açıklama</h2>
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <div>
                  <h2 className="mb-6 text-lg font-bold text-slate-900">Benzer ilanlar</h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {similarListings.map((item) => (
                      <CarCard key={item.id} listing={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="w-full lg:w-[380px] shrink-0 space-y-4 lg:sticky lg:top-6">
              
              {/* Seller Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-400">Satıcı Bilgileri</h3>
                
                <div className="mb-5 flex items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="relative size-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center font-bold text-xl text-slate-300">
                    {seller?.businessLogoUrl ? (
                      <Image src={seller.businessLogoUrl} alt={seller.fullName || ""} fill className="object-cover" />
                    ) : (
                      seller?.fullName?.[0] || "S"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{seller?.businessName || seller?.fullName}</p>
                    <p className="text-xs font-medium text-slate-500">{seller?.userType === "professional" ? "Kurumsal Galeri" : "Bireysel Satıcı"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ContactActions listingId={listing.id} sellerId={listing.sellerId} />
                  <Link 
                    href={`/gallery/${seller?.businessSlug || seller?.id}`}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft size={15} className="rotate-180" />
                    Satıcının Diğer İlanları
                  </Link>
                </div>
              </div>

              {/* Security Tips */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Güvenlik İpuçları
                </h3>
                <ul className="space-y-3.5">
                  {[
                    "Aracı görmeden kapora göndermeyin.",
                    "Ekspertiz raporunu onaylatın.",
                    "Ödemeyi noter huzurunda yapın."
                  ].map(tip => (
                    <li key={tip} className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
                      <span className="mt-1 size-1.5 rounded-full bg-slate-300 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
                <button className="mt-5 text-xs font-semibold text-rose-500 hover:underline">
                  İlanı Şikayet Et
                </button>
              </div>

              {/* Quick Offer */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-1 text-base font-bold text-slate-900">Hızlı Teklif</h3>
                <p className="mb-5 text-xs text-slate-500 font-medium">Satıcıya fiyat teklifi gönderin.</p>
                <div className="flex gap-2.5 mb-4">
                  <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3.5 text-center">
                    <p className="text-sm font-bold text-slate-900">₺{new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.97))}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Düşük teklif</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3.5 text-center">
                    <p className="text-sm font-bold text-slate-900">₺{new Intl.NumberFormat("tr-TR").format(Math.round(listing.price * 0.99))}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Yüksek teklif</p>
                  </div>
                </div>
                <button className="w-full h-11 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                  Kendi Teklifini Yap
                </button>
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
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-slate-900 capitalize">{value}</p>
      </div>
    </div>
  );
}
