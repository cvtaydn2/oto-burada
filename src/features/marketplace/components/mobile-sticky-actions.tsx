"use client";

import dynamic from "next/dynamic";

import { formatCurrency } from "@/lib/utils/format";
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
      <div className="pointer-events-auto px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 sm:px-4 sm:pt-4">
        <div className="glass mx-auto flex max-w-7xl flex-col gap-3 overflow-hidden rounded-[24px] p-3 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
            <div className="flex min-w-0 shrink flex-col">
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70"
                aria-hidden="true"
              >
                Fiyat
              </span>
              <div
                className="text-base font-bold text-foreground sm:text-lg"
                aria-label={`Fiyat: ${formatCurrency(price)} TL`}
              >
                {formatCurrency(price)}{" "}
                <span className="text-xs font-semibold text-muted-foreground/70" aria-hidden="true">
                  TL
                </span>
              </div>
            </div>

            <p className="max-w-[14rem] text-pretty text-[10px] font-medium leading-4 text-muted-foreground/75 sm:text-right">
              Hızlı WhatsApp ve arama aksiyonları aşağıda hazır.
            </p>
          </div>

          <div className="w-full min-w-0">
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
