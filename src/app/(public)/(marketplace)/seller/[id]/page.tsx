import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Share2,
  Star,
  User,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SellerRatingInfo } from "@/components/profile/seller-rating-info";
import { ReviewForm } from "@/components/reviews/review-form";
import { ListingCard } from "@/components/shared/listing-card";
import { TrustBadge } from "@/components/shared/trust-badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getSellerTrustUI } from "@/lib/listings/trust-ui";
import { getListingDopingDisplayItems } from "@/lib/listings/utils";
import { cn } from "@/lib/utils";
import {
  getMarketplaceSeller,
  getPublicMarketplaceListings,
} from "@/services/listings/marketplace-listings";
import { getSellerTrustSummary } from "@/services/profile/profile-trust";
import { getSellerReviews, getSellerReviewStats } from "@/services/profile/seller-reviews";
import { type Listing } from "@/types";

interface SellerProfilePageProps {
  params: Promise<{
    id: string;
  }>;
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
      {/* Seller Header */}
      <section
        className={cn(
          "rounded-xl border p-6 lg:p-8 shadow-sm transition-colors",
          trustUI.styles.bg,
          trustUI.styles.border
        )}
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background/50 border border-border shadow-sm">
              {seller.avatarUrl ? (
                <Image
                  src={seller.avatarUrl}
                  alt={seller.fullName || "Satıcı"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <User size={32} className="text-muted-foreground/30" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={cn("text-xl font-bold tracking-tight", trustUI.styles.text)}>
                  {seller.fullName || "İsimsiz Satıcı"}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border",
                    trustUI.styles.bg,
                    trustUI.styles.text,
                    trustUI.styles.border
                  )}
                >
                  {trustUI.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground/70">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {seller.city || "Konum belirtilmedi"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {memberSinceYear ?? new Date().getFullYear()}&apos;den beri üye
                </div>
              </div>

              {trustUI.subMessage && (
                <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-tight mt-1">
                  {trustUI.subMessage}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2 sm:w-auto">
            {seller.phone && trustUI.isContactable && (
              <Button
                size="lg"
                className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#1fb355] text-white font-bold text-xs tracking-widest uppercase md:px-8 shadow-sm"
                asChild
              >
                <a
                  href={`https://wa.me/${seller.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare size={16} className="mr-2 fill-current" />
                  WhatsApp
                </a>
              </Button>
            )}
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl">
              <Share2 size={18} />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Aktif İlan", value: totalListingsCount, icon: Car },
            { label: "Aktif Vitrin", value: featuredListingCount, icon: CheckCircle2 },
            { label: "Üyelik Yılı", value: memberSinceYear ?? "—", icon: Clock },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-background/50 p-4 transition-colors hover:bg-background/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-muted-foreground/60">
                  <stat.icon size={18} />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground leading-none">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Factors */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-border">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 mr-2">
            GÜVEN SİNYALLERİ
          </span>
          {trustSummary.signals.map((signal) => (
            <div
              key={signal}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-tight",
                trustUI.styles.bg,
                trustUI.styles.text,
                trustUI.styles.border
              )}
            >
              <CheckCircle2 size={11} />
              {signal}
            </div>
          ))}
          <div className="ml-auto">
            <TrustBadge
              badgeLabel={trustUI.label}
              score={seller.trustScore ?? 0}
              tone={trustUI.tone}
            />
          </div>
        </div>
      </section>

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
            <ReviewForm sellerId={sellerId}>
              <Button size="sm" variant="outline" className="gap-2">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                Değerlendir
              </Button>
            </ReviewForm>
          )}
        </div>
        {reviews.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {review.reviewer?.full_name?.[0]?.toUpperCase() ?? "K"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {review.reviewer?.full_name ?? "Anonim"}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(review.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        className={
                          star <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-100 text-slate-200"
                        }
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Bu satıcı hakkında henüz değerlendirme yapılmamış.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
