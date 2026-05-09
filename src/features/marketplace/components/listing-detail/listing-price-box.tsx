import dynamic from "next/dynamic";
import { Suspense } from "react";

import {} from "@/lib";
import { formatPrice } from "@/lib/utils/format";

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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Satış Fiyatı
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-x-2 gap-y-1 sm:mb-4">
        <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {formatPrice(listingPrice)}
        </span>
        <span className="pb-1 text-base font-medium text-muted-foreground/60 sm:text-xl">TL</span>
      </div>

      <MarketValuationBadge
        status={marketValuation.status}
        diff={marketValuation.diff}
        className="mb-4 sm:mb-5"
      />

      {!isOwner && (
        <div className="mb-4 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs font-medium leading-5 text-muted-foreground lg:hidden">
          Hızlı iletişim seçenekleri ekranın altındaki sabit çubukta yer alır.
        </div>
      )}

      {!isOwner ? (
        <div className="hidden lg:block">
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
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm font-medium text-muted-foreground">
          Bu sizin ilanınız
        </div>
      )}

      {!isOwner && (
        <div className="hidden lg:block">
          <ReserveButton listingId={listingId} />
        </div>
      )}
    </div>
  );
}
