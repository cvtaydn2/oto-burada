import dynamic from "next/dynamic";
import { Suspense } from "react";

import { formatPrice } from "@/features/shared/lib";

import { MarketValuationBadge } from "../market-valuation-badge";

const ContactActions = dynamic(
  () => import("@/features/marketplace/components/contact-actions").then((m) => m.ContactActions),
  { loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" /> }
);

const ReserveButton = dynamic(
  () => import("@/features/reservations/components/reserve-button").then((m) => m.ReserveButton),
  { loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" /> }
);

import type { Profile } from "@/types";

interface ListingPriceBoxProps {
  listingId: string;
  listingSlug: string;
  sellerId: string;
  seller: Partial<Profile> | null;
  listingTitle: string;
  listingPrice: number;
  currentUserId?: string;
  isOwner: boolean;
  marketValuation: { status: "good" | "fair" | "high" | "unknown"; diff: number };
}

export function ListingPriceBox({
  listingId,
  listingSlug,
  sellerId,
  seller,
  listingTitle,
  listingPrice,
  currentUserId,
  isOwner,
  marketValuation,
}: ListingPriceBoxProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Satış Fiyatı
      </div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {formatPrice(listingPrice)}
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
            listingId={listingId}
            listingSlug={listingSlug}
            sellerId={sellerId}
            seller={seller}
            listingTitle={listingTitle}
            listingPrice={listingPrice}
            currentUserId={currentUserId}
          />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm font-medium text-muted-foreground">
          Bu sizin ilanınız
        </div>
      )}

      {/* Reserve Button */}
      {!isOwner && <ReserveButton listingId={listingId} />}
    </div>
  );
}
