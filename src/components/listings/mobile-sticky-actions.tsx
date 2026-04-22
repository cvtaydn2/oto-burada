"use client"

import dynamic from "next/dynamic";

import { useAuthUser } from "@/components/shared/auth-provider";
import { formatCurrency } from "@/lib/utils";
import type { Profile } from "@/types";

const ContactActions = dynamic(
  () => import("./contact-actions").then((mod) => mod.ContactActions),
  {
    loading: () => <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />,
  },
);

interface MobileStickyActionsProps {
    listingId: string;
    listingSlug: string;
    sellerId: string;
    seller?: Partial<Profile> | null;
    price: number;
    currentUserId?: string | null;
}

export function MobileStickyActions({ 
    listingId, 
    listingSlug,
    sellerId,
    seller,
    price,
    currentUserId,
}: MobileStickyActionsProps) {
    const { isAuthenticated } = useAuthUser();
    const loginUrl = `/login?next=${encodeURIComponent(`/listing/${listingSlug}`)}`;
    // If this is the seller's own listing, render nothing (no contact needed)
    const isOwnListing = Boolean(currentUserId && currentUserId === sellerId);

    if (isOwnListing) return null;
    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden pointer-events-none">
            <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 pointer-events-auto">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4 glass rounded-[24px] shadow-2xl pb-safe">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">Fiyat</span>
                        <div className="text-lg font-bold text-foreground">
                            {formatCurrency(price)} <span className="text-xs font-semibold text-muted-foreground/70">TL</span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-[200px]">
                        {isAuthenticated ? (
                            <ContactActions listingId={listingId} listingSlug={listingSlug} sellerId={sellerId} seller={seller} currentUserId={currentUserId} />
                        ) : (
                            <a
                                href={loginUrl}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-12 px-4 text-xs font-bold text-white shadow-lg active:scale-95 transition-all"
                            >
                                İletişim İçin Giriş Yap
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
