import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// SEO & Monitoring
import { ListingDetailStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { buildListingDetailMetadata, buildAbsoluteUrl } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth/session";

// Services
import {
  getMarketplaceListingBySlug,
  getMarketplaceSeller,
  getStoredListingBySlug,
} from "@/services/listings/marketplace-listings";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { breadcrumbs as breadcrumbLabels } from "@/lib/constants/ui-strings";

// Section Components
import { ListingHero } from "@/components/listings/listing-detail/listing-hero";
import { ListingGallerySection } from "@/components/listings/listing-detail/listing-gallery-section";
import { ListingPriceTrust } from "@/components/listings/listing-detail/listing-price-trust";
import { ListingSpecsSection } from "@/components/listings/listing-detail/listing-specs-section";
import { ListingReportSection } from "@/components/listings/listing-detail/listing-report-section";
import { ListingAnalysisSection } from "@/components/listings/listing-detail/listing-analysis-section";
import { ListingRelated, ListingRelatedSkeleton } from "@/components/listings/listing-detail/listing-related";
import { ListingSellerSidebar } from "@/components/listings/listing-detail/listing-seller-sidebar";
import { Panel } from "@/components/shared/design-system/Panel";
import { ListingViewTracker } from "@/features/marketplace/components/listing-view-tracker";

const ListingMap = dynamic(
  () => import("@/components/shared/listing-map-wrapper").then((mod) => mod.ListingMapWrapper),
  { loading: () => <div className="h-60 animate-pulse rounded-xl bg-muted" /> }
);

const ListingDetailActions = dynamic(
  () => import("@/components/listings/listing-detail-actions").then((mod) => mod.ListingDetailActions),
  { loading: () => <div className="h-9 w-44 animate-pulse rounded-lg bg-muted" /> }
);

const MobileStickyActions = dynamic(
  () => import("@/components/listings/mobile-sticky-actions").then((mod) => mod.MobileStickyActions)
);

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);
  if (!listing) return { title: "İlan Bulunamadı" };
  return buildListingDetailMetadata(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = await getMarketplaceListingBySlug(slug);

  if (!listing) {
    const listingFromDb = await getStoredListingBySlug(slug);
    if (listingFromDb && listingFromDb.status !== "approved") {
      return (
        <main className="min-h-screen bg-background flex flex-col">
          <div className="mx-auto max-w-[1400px] px-6 py-10 w-full flex-1">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">İlan Artık Aktif Değil</h1>
              <p className="text-muted-foreground max-w-md mb-6">
                Bu ilan satışa kapatılmış veya süresi dolmuş olabilir.
              </p>
              <Link 
                href="/listings" 
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition"
              >
                Diğer İlanları İncele
              </Link>
            </div>
          </div>
        </main>
      );
    }
    notFound();
  }

  const [seller, currentUser] = await Promise.all([
    getMarketplaceSeller(listing.sellerId),
    getCurrentUser(),
  ]);

  const insight = getListingCardInsights(listing);
  
  const pageBreadcrumbs = [
    { name: breadcrumbLabels.home, url: "/" },
    { name: breadcrumbLabels.cars, url: "/listings" },
    { name: listing.brand, url: `/listings?brand=${encodeURIComponent(listing.brand)}` },
    { name: listing.model, url: `/listing/${listing.slug}` }
  ];

  return (
    <>
      {/* Tracking & SEO */}
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
        items={pageBreadcrumbs.map(b => ({ name: b.name, url: buildAbsoluteUrl(b.url) }))} 
      />

      <main className="min-h-screen bg-background flex flex-col">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10 w-full flex-1">
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 lg:mb-10">
            <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
              {pageBreadcrumbs.map((b, i) => (
                <div key={b.url} className="flex items-center gap-2 sm:gap-3">
                  <Link 
                    href={b.url} 
                    className={cn(
                      "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all hover:text-primary truncate max-w-[80px] sm:max-w-none", 
                      i === pageBreadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {b.name}
                  </Link>
                  {i < pageBreadcrumbs.length - 1 && <div className="size-1 rounded-full bg-border" />}
                </div>
              ))}
            </nav>
            <ListingDetailActions listingId={listing.id} price={listing.price} sellerId={listing.sellerId} title={listing.title} />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            <div className="w-full min-w-0 flex-1 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10">
              <ListingGallerySection listing={listing} />
              <ListingHero listing={listing} insight={insight} />
              <ListingPriceTrust listing={listing} seller={seller} insight={insight} />
              <ListingSpecsSection listing={listing} />
              <ListingReportSection listing={listing} />
              
              <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
                <ListingAnalysisSection listing={listing} insight={insight} />
              </Suspense>

              <Panel padding="xl">
                <h2 className="mb-6 text-xl font-bold text-foreground tracking-tight">İlan Hakkında</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-base leading-loose text-foreground/80 font-medium whitespace-pre-wrap">{listing.description}</p>
                </div>
              </Panel>

              <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-muted" />}>
                <Panel padding="xl">
                  <h2 className="mb-8 flex items-center gap-4 text-xl font-bold text-foreground tracking-tight">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <ChevronRight size={24} className="rotate-90" />
                    </div>
                    Konum
                  </h2>
                  <div className="rounded-2xl overflow-hidden border border-border/40">
                     <ListingMap city={listing.city} district={listing.district} className="h-80" />
                  </div>
                </Panel>
              </Suspense>

              <Suspense fallback={<ListingRelatedSkeleton />}>
                <ListingRelated brand={listing.brand} slug={listing.slug} city={listing.city} />
              </Suspense>
            </div>

            <Suspense fallback={<div className="w-full lg:w-[400px] h-[600px] animate-pulse rounded-3xl bg-muted" />}>
              <ListingSellerSidebar 
                listing={listing} 
                seller={seller} 
                currentUser={currentUser} 
              />
            </Suspense>
          </div>
        </div>
      </main>

      <MobileStickyActions 
        listingId={listing.id} 
        listingSlug={listing.slug} 
        sellerId={listing.sellerId} 
        seller={seller}
        price={listing.price} 
        currentUserId={currentUser?.id ?? null} 
      />
    </>
  );
}

const ChevronRight = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

