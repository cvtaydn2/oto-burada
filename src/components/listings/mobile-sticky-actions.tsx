"use client";

import dynamic from "next/dynamic";

import { formatCurrency } from "@/lib/utils";
import type { Profile } from "@/types";

const ContactActions = dynamic(
  () => import("./contact-actions").then((mod) => mod.ContactActions),
  {
    loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />,
  }
);

interface MobileStickyActionsProps {
  listingId: string;
  listingSlug: string;
  listingTitle?: string;
  sellerId: string;
  seller?: Partial<Profile> | null;
  price: number;
  currentUserId?: string | null;
}

export function MobileStickyActions({
  listingId,
  listingSlug,
  listingTitle,
  sellerId,
  seller,
  price,
  currentUserId,
}: MobileStickyActionsProps) {
  const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);

  if (isOwnListing) return null;
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 lg:hidden">
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 pointer-events-auto">
        <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[24px] p-3 shadow-2xl">
          <div className="flex shrink-0 flex-col">
            <span
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"
              aria-hidden="true"
            >
              Fiyat
            </span>
            <div
              className="text-lg font-bold text-foreground"
              aria-label={`Fiyat: ${formatCurrency(price)} TL`}
            >
              {formatCurrency(price)}{" "}
              <span className="text-xs font-semibold text-muted-foreground/70" aria-hidden="true">
                TL
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <ContactActions
              listingId={listingId}
              listingSlug={listingSlug}
              sellerId={sellerId}
              seller={seller}
              listingTitle={listingTitle}
              listingPrice={price}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
