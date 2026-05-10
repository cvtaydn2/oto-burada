import { Car, Star } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingCard } from "@/components/shared/listing-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/lib/session";
import { SellerHeaderSection } from "@/features/marketplace/components/seller-header-section";
import { SellerReviewForm } from "@/features/marketplace/components/seller-review-form";
import { SellerReviewsList } from "@/features/marketplace/components/seller-reviews-list";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import { getListingDopingDisplayItems } from "@/features/marketplace/lib/utils";
import {
  getMarketplaceSeller,
  getPublicMarketplaceListings,
} from "@/features/marketplace/services/marketplace-listings";
import { SellerRatingInfo } from "@/features/profile/components/seller-rating-info";
import { getSellerTrustSummary } from "@/features/profile/services/profile-trust";
import { getSellerReviews, getSellerReviewStats } from "@/features/profile/services/seller-reviews";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { type Listing } from "@/types";

interface SellerProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: SellerProfilePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const sellerId = resolvedParams.id;
  const seller = await getMarketplaceSeller(sellerId);

  if (!seller) {
    return {
      title: "Satıcı Bulunamadı | OtoBurada",
      robots: { index: false, follow: false },
    };
  }

  const sellerName = seller.businessName || seller.fullName || "Satıcı";

  return {
    title: `${sellerName} | OtoBurada Satıcı Profili`,
    description: `${sellerName} profiline ait araç ilanlarını ve değerlendirmelerini inceleyin.`,
    alternates: {
      canonical: buildAbsoluteUrl(`/seller/${sellerId}`),
    },
  };
}

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const resolvedParams = await params;
  const sellerId = resolvedParams.id;

  const seller = await getMarketplaceSeller(sellerId);
  if (!seller) {
    notFound();
  }

  const listingsResult = await getPublicMarketplaceListings({
    sellerId,
    limit: 24,
    page: 1,
    sort: "newest",
  });

  const sellerListings = listingsResult.listings;
  const totalListingsCount = listingsResult.total;
  const featuredListingCount = sellerListings.filter(
    (listing: Listing) => getListingDopingDisplayItems(listing).length > 0
  ).length;
  const trustSummary = getSellerTrustSummary(seller, totalListingsCount);
  const trustUI = getSellerTrustUI(seller);
  const memberSinceDate = seller.createdAt ? new Date(seller.createdAt) : null;
  const memberSinceYear =
    memberSinceDate && !isNaN(memberSinceDate.getTime()) ? memberSinceDate.getFullYear() : null;
  const [ratingSummary, reviews] = await Promise.all([
    getSellerReviewStats(sellerId),
    getSellerReviews(sellerId),
  ]);
  const currentUser = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-6 md:space-y-8 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <SellerHeaderSection
        seller={seller}
        totalListingsCount={totalListingsCount}
        featuredListingCount={featuredListingCount}
        memberSinceYear={memberSinceYear}
        trustSummary={trustSummary}
        trustUI={trustUI}
      />

      {/* Seller Listings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Satıcının İlanları ({totalListingsCount})
          </h2>
        </div>

        {sellerListings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellerListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Car size={32} className="text-muted-foreground/70" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Bu satıcının aktif ilanı yok
            </h3>
            <p className="text-muted-foreground">Satıcı henüz araç ilanı yayınlamamış.</p>
          </div>
        )}
      </section>

      {/* Seller Reviews */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Değerlendirmeler</h2>
            {ratingSummary.count > 0 && (
              <SellerRatingInfo average={ratingSummary.average} count={ratingSummary.count} />
            )}
          </div>
          {currentUser && currentUser.id !== sellerId && (
            <SellerReviewForm sellerId={sellerId}>
              <Button size="sm" variant="outline" className="gap-2">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                Değerlendir
              </Button>
            </SellerReviewForm>
          )}
        </div>
        <SellerReviewsList reviews={reviews} />
      </section>
    </div>
  );
}
