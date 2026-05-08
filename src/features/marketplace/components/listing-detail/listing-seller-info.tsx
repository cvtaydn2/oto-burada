import type { User } from "@supabase/supabase-js";
import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";

import type { Profile } from "@/types";

import { SellerReviewForm } from "../seller-review-form";
import { SellerTrustBadges } from "../seller-trust-badges";

interface ListingSellerInfoProps {
  seller: Partial<Profile> | null;
  membershipLabel?: string | null;
  sellerRating: { average: number; count: number };
  isOwner: boolean;
  currentUser: User | null;
  listingId: string;
}

export function ListingSellerInfo({
  seller,
  membershipLabel,
  sellerRating,
  isOwner,
  currentUser,
  listingId,
}: ListingSellerInfoProps) {
  const displayName = seller?.businessName || seller?.fullName || "Satıcı";
  const initial = displayName.charAt(0) || "?";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Seller Card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary sm:size-12 sm:text-xl">
            {initial}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="truncate text-sm font-bold text-foreground">{displayName}</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {seller?.userType === "professional" ? "Galeri" : "Bireysel"}
              </span>
              {membershipLabel && (
                <span className="text-[10px] leading-5 text-muted-foreground">
                  {membershipLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        {sellerRating.count > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-foreground">
              {sellerRating.average.toFixed(1)}
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              ({sellerRating.count} değerlendirme)
            </span>
          </div>
        )}

        {/* Trust Badges */}
        <SellerTrustBadges seller={seller} className="mt-4" />

        {seller?.businessSlug && (
          <Link
            href={`/galeri/${seller.businessSlug}`}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-muted text-xs font-bold text-foreground transition hover:bg-muted/80"
          >
            Tüm İlanları Gör
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Seller Review Form */}
      {!isOwner && currentUser && (
        <SellerReviewForm
          sellerId={seller?.id || ""}
          listingId={listingId}
          sellerName={displayName}
        />
      )}
    </div>
  );
}
