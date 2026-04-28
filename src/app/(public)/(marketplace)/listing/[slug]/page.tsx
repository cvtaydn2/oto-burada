import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Eye,
  Flag,
  Hash,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DamageReportCard } from "@/components/listings/damage-report-card";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { ExpertPdfButton } from "@/components/listings/expert-pdf-button";
import { FavoriteButton } from "@/components/listings/favorite-button";
// Components
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingQuestions } from "@/components/listings/listing-questions";
import { SellerReviewForm } from "@/components/listings/seller-review-form";
import { SellerTrustBadges } from "@/components/listings/seller-trust-badges";
import { ShareButton } from "@/components/listings/share-button";
import { MarketValuationBadge } from "@/components/market/market-valuation-badge";
import { PriceAnalysisWidget } from "@/components/market/price-analysis-widget";
// import { PriceHistoryChart } from "@/components/market/price-history-chart";
// SEO & Monitoring
import {
  BreadcrumbStructuredData,
  ListingDetailStructuredData,
} from "@/components/seo/structured-data";
import { FraudWarningBanner } from "@/components/shared/fraud-warning-banner";
import { ListingCard } from "@/components/shared/listing-card";
import { getCleanDescription, getListingBreadcrumbs } from "@/domain/logic/listing-factory";
import { getProfileMembershipLabel } from "@/domain/logic/profile-logic";
import { ListingSpecs } from "@/features/marketplace/components/listing-detail/listing-specs";
import { ListingViewTracker } from "@/features/marketplace/components/listing-view-tracker";
import { getCurrentUser } from "@/lib/auth/session";
import { buildAbsoluteUrl, buildListingDetailMetadata } from "@/lib/seo";
import { cn, formatPrice } from "@/lib/utils";
import { getMarketValuation } from "@/services/listings/listing-price-history";
import {
  getMarketplaceListingBySlug,
  getMarketplaceSeller,
  getSimilarMarketplaceListings,
  getStoredListingBySlug,
} from "@/services/listings/marketplace-listings";
import { getSellerReviewStats as getSellerRatingSummary } from "@/services/profile/seller-reviews";

const ListingMap = dynamic(
  () => import("@/components/shared/listing-map-wrapper").then((m) => m.ListingMapWrapper),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> }
);

const ContactActions = dynamic(
  () => import("@/components/listings/contact-actions").then((m) => m.ContactActions),
  { loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" /> }
);

const MobileStickyActions = dynamic(() =>
  import("@/components/listings/mobile-sticky-actions").then((m) => m.MobileStickyActions)
);

const ReportListingForm = dynamic(() =>
  import("@/components/forms/report-listing-form").then((m) => m.ReportListingForm)
);

const PriceHistoryChart = dynamic(
  () => import("@/components/market/price-history-chart").then((m) => m.PriceHistoryChart),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> }
);

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Try marketplace (approved) first
  let listing = await getMarketplaceListingBySlug(slug);

  // If not found in marketplace, try stored (admin/owner bypass)
  if (!listing) {
    listing = await getStoredListingBySlug(slug);
  }

  if (!listing) return { title: "İlan Bulunamadı" };

  const metadata = buildListingDetailMetadata(listing);

  // Prevent indexing of non-approved listings
  if (listing.status !== "approved") {
    return {
      ...metadata,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return metadata;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;

  // ── Data fetching ─────────────────────────────────────────────────────────
  // PERFORMANCE FIX: Fetch marketplace and stored listings in parallel
  // This avoids sequential fallback delay (200-400ms savings)
  const [currentUser, rawListing, storedListing] = await Promise.all([
    getCurrentUser(),
    getMarketplaceListingBySlug(slug),
    // Fetch stored listing in parallel for admin/owner bypass
    // This is safe - we only use it if marketplace listing is not found
    getStoredListingBySlug(slug, { includeBanned: true }),
  ]);

  let listing = rawListing;

  // ── Admin/Owner Bypass ──────────────────────────────────────────────────
  if (!listing && storedListing) {
    const isAdmin = currentUser?.user_metadata?.role === "admin";
    const isOwner = currentUser?.id === storedListing.sellerId;

    if (isAdmin || isOwner) {
      listing = storedListing;
    } else if (storedListing.status !== "approved") {
      return (
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="size-10 text-amber-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">İlan Yayında Değil</h1>
          <p className="mb-8 max-w-md text-muted-foreground italic">
            Bu ilan henüz onaylanmamış, reddedilmiş veya yayından kaldırılmış olabilir.
          </p>
          <Link
            href="/listings"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90 transition"
          >
            Piyasadaki Diğer İlanlar
          </Link>
        </main>
      );
    } else {
      notFound();
    }
  }

  if (!listing) return null;

  const [seller, similarListings, sellerRating, marketValuation] = await Promise.all([
    getMarketplaceSeller(listing.sellerId),
    getSimilarMarketplaceListings(listing.slug, listing.brand, listing.city),
    getSellerRatingSummary(listing.sellerId),
    getMarketValuation({
      price: listing.price,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
    }),
  ]);

  const isOwner = currentUser?.id === listing.sellerId;

  // Seller membership
  const membershipLabel = getProfileMembershipLabel(seller?.createdAt ?? null);

  // Breadcrumbs
  const pageBreadcrumbs = getListingBreadcrumbs(listing);

  // Description cleanup
  const cleanDescription = getCleanDescription(listing.description);

  return (
    <>
      {/* ── Tracking & SEO ── */}
      <ListingViewTracker
        listingId={listing.id}
        listingSlug={listing.slug}
        brand={listing.brand}
        model={listing.model}
        city={listing.city}
        price={listing.price}
        year={listing.year}
        status={listing.status}
      />
      <ListingDetailStructuredData
        listing={listing}
        url={buildAbsoluteUrl(`/listing/${listing.slug}`)}
        sellerName={seller?.businessName ?? seller?.fullName ?? undefined}
      />
      <BreadcrumbStructuredData
        items={pageBreadcrumbs.map((b) => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))}
      />

      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-32 lg:pb-12">
          {/* ── Breadcrumb ── */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          >
            {pageBreadcrumbs.map((b, i) => (
              <div key={b.url} className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={b.url}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-primary",
                    i === pageBreadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {b.name}
                </Link>
                {i < pageBreadcrumbs.length - 1 && (
                  <ChevronRight size={12} className="text-border" />
                )}
              </div>
            ))}
          </nav>

          {/* ── Fraud Warning Banner ── */}
          <FraudWarningBanner className="mb-6" />

          {/* ══════════════════════════════════════════════════════════════════
              ZONE 1 — HERO: Gallery + Price/Contact (above the fold)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_360px] lg:gap-8 mb-6 sm:mb-8">
            {/* ── Left: Gallery ── */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <ListingGallery images={listing.images} title={listing.title} />
              </div>

              {/* Title block — visible on all breakpoints, primary info */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                {/* Badges row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {listing.brand}
                  </span>
                  <span className="rounded-lg bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {listing.year} Model
                  </span>
                  {listing.featured && (
                    <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                      <Sparkles size={10} />
                      Öne Çıkan
                    </span>
                  )}
                  {listing.expertInspection?.hasInspection && (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      <ShieldCheck size={10} />
                      Ekspertizli
                    </span>
                  )}
                  {marketValuation.status === "good" && (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      <TrendingDown size={10} />
                      Avantajlı Fiyat
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {listing.model}
                </h1>
                <p className="mb-4 text-sm text-muted-foreground">{listing.title}</p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary" />
                    {listing.city}, {listing.district}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} />
                    {(listing.viewCount || 0).toLocaleString("tr-TR")} görüntülenme
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground/60">
                    <Hash size={13} />
                    {listing.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Action row */}
                <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
                  <ShareButton
                    title={listing.title}
                    price={listing.price}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 text-xs font-bold text-muted-foreground transition hover:bg-muted"
                  />
                  <FavoriteButton
                    listingId={listing.id}
                    className="size-9 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                  />
                </div>
              </div>
            </div>

            {/* ── Right: Price + Contact (sticky on desktop) ── */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Price Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Satış Fiyatı
                </div>
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {formatPrice(listing.price)}
                  </span>
                  <span className="text-xl font-medium text-muted-foreground/60">TL</span>
                </div>

                {/* Market valuation badge */}
                <MarketValuationBadge
                  status={marketValuation.status}
                  diff={marketValuation.diff}
                  className="mb-6"
                />

                {/* Contact Actions */}
                {!isOwner ? (
                  <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
                    <ContactActions
                      listingId={listing.id}
                      listingSlug={listing.slug}
                      sellerId={listing.sellerId}
                      seller={seller}
                      listingTitle={listing.title}
                      listingPrice={listing.price}
                      currentUserId={currentUser?.id}
                    />
                  </Suspense>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm font-medium text-muted-foreground">
                    Bu sizin ilanınız
                  </div>
                )}
              </div>

              {/* Seller Card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                    {(() => {
                      const displayName = seller?.businessName || seller?.fullName || "?";
                      const initial = displayName.charAt(0) || "?";
                      return initial;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">
                      {seller?.businessName || seller?.fullName || "Satıcı"}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {seller?.userType === "professional" ? "Galeri" : "Bireysel"}
                      </span>
                      {membershipLabel && (
                        <span className="text-[10px] text-muted-foreground">{membershipLabel}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                {sellerRating.count > 0 && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-foreground">
                      {sellerRating.average.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({sellerRating.count} değerlendirme)
                    </span>
                  </div>
                )}

                {/* Trust Badges */}
                <SellerTrustBadges seller={seller} className="mt-4" />

                {seller?.businessSlug && (
                  <Link
                    href={`/galeri/${seller.businessSlug}`}
                    className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-muted text-xs font-bold text-foreground transition hover:bg-muted/80"
                  >
                    Tüm İlanları Gör
                    <ChevronRight size={14} />
                  </Link>
                )}
              </div>

              {/* Safety Notice */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  Güvenli Alışveriş
                </div>
                <ul className="space-y-1.5 text-xs text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">•</span>
                    Aracı görmeden kapora göndermeyin
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">•</span>
                    Ödemeyi noter huzurunda yapın
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">•</span>
                    Ekspertiz raporu isteyin
                  </li>
                </ul>
              </div>

              {/* Seller Review Form */}
              {!isOwner && currentUser && (
                <SellerReviewForm
                  sellerId={listing.sellerId}
                  listingId={listing.id}
                  sellerName={seller?.businessName || seller?.fullName || "Satıcı"}
                />
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              ZONE 2 — SPECS: 4-column quick facts
          ══════════════════════════════════════════════════════════════════ */}
          <ListingSpecs
            year={listing.year}
            mileage={listing.mileage}
            fuelType={listing.fuelType}
            transmission={listing.transmission}
          />

          {/* ══════════════════════════════════════════════════════════════════
              ZONE 3 — CONTENT: Description, Inspection, Damage, Analysis, Map
          ══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            {/* Description */}
            {cleanDescription && (
              <section
                id="aciklama"
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-6"
              >
                <h2 className="mb-4 text-lg font-bold text-foreground">İlan Açıklaması</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {cleanDescription}
                </p>
              </section>
            )}

            {/* Expert Inspection */}
            <section
              id="ekspertiz"
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Ekspertiz Raporu</h2>
                </div>
                {listing.expertInspection?.documentPath && (
                  <ExpertPdfButton documentPath={listing.expertInspection.documentPath} />
                )}
              </div>
              <ExpertInspectionCard expertInspection={listing.expertInspection} />
            </section>

            {/* Damage Report */}
            <section
              id="hasar"
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Zap size={20} />
                </div>
                <h2 className="text-lg font-bold text-foreground">Kaporta & Boya Durumu</h2>
              </div>
              <DamageReportCard
                damageStatus={listing.damageStatusJson}
                tramerAmount={listing.tramerAmount}
              />
            </section>

            {/* Price History Chart */}
            <section
              id="fiyat"
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Piyasa Analizi</h2>
                  <p className="text-xs text-muted-foreground">
                    İlanın fiyat geçmişi ve piyasa karşılaştırması
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                <PriceHistoryChart listingId={listing.id} currentPrice={listing.price} />

                <div className="space-y-4">
                  <PriceAnalysisWidget
                    currentPrice={listing.price}
                    avgPrice={marketValuation.avgPrice!}
                    minPrice={marketValuation.minPrice!}
                    maxPrice={marketValuation.maxPrice!}
                    status={marketValuation.status}
                  />

                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Veri Analizi
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {marketValuation.listingCount
                        ? `${marketValuation.listingCount} benzer ilan baz alınarak hesaplanmıştır.`
                        : "Henüz yeterli piyasa verisi bulunmamaktadır."}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Questions Section */}
            <section
              id="sorular"
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-6"
            >
              <ListingQuestions
                listingId={listing.id}
                isOwner={isOwner}
                currentUserId={currentUser?.id}
              />
            </section>

            {/* Map */}
            <section
              id="konum"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="border-b border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Konum</h2>
                    <p className="text-xs text-muted-foreground">
                      {listing.city}, {listing.district}
                    </p>
                  </div>
                </div>
              </div>
              <Suspense fallback={<div className="h-64 animate-pulse bg-muted" />}>
                <ListingMap city={listing.city} district={listing.district} className="h-64" />
              </Suspense>
            </section>

            {/* Report Listing */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                  <Flag size={20} />
                </div>
                <h2 className="text-lg font-bold text-foreground">İlanı Bildir</h2>
              </div>
              <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
                <ReportListingForm
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                  userId={currentUser?.id}
                />
              </Suspense>
            </section>

            {/* Similar Listings */}
            {similarListings.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Benzer İlanlar</h2>
                  <Link
                    href={`/listings?brand=${encodeURIComponent(listing.brand)}`}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Tümünü Gör
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {similarListings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <MobileStickyActions
        listingId={listing.id}
        listingSlug={listing.slug}
        listingTitle={listing.title}
        sellerId={listing.sellerId}
        seller={seller}
        price={listing.price}
        currentUserId={currentUser?.id ?? null}
      />
    </>
  );
}
