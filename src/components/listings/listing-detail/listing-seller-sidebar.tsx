import type { User } from "@supabase/supabase-js";
import { CalendarDays, ShieldCheck, Star, Store } from "lucide-react";

import { ContactActions } from "@/components/listings/contact-actions";
import { Panel } from "@/components/shared/design-system/Panel";
import { getMembershipYears, getMemberSinceYear } from "@/lib/utils/listing-utils";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import { getSellerRatingSummary } from "@/services/profile/seller-reviews";
import type { Listing, Profile } from "@/types";

interface ListingSellerSidebarProps {
  listing: Listing;
  seller: Partial<Profile> | null;
  currentUser: User | null;
}

export async function ListingSellerSidebar({
  listing,
  seller,
  currentUser,
}: ListingSellerSidebarProps) {
  const sellerRatingSummary = await getSellerRatingSummary(listing.sellerId);
  const memberSince = getMemberSinceYear(seller?.createdAt ?? null);
  const membershipYears = getMembershipYears(memberSince);
  const isOwner = currentUser?.id === listing.sellerId;
  const { label, isTrusted, tone } = getSellerTrustUI(seller);

  // Human-friendly membership label — avoids "0 Yıl" for new members
  const membershipLabel =
    membershipYears === null
      ? "—"
      : membershipYears === 0
        ? "Yeni Üye"
        : membershipYears === 1
          ? "1 Yıl"
          : `${membershipYears} Yıl`;

  // Footer text — only shown when memberSince is known, avoids "null'den beri"
  const memberSinceText = memberSince != null ? `${memberSince}'den beri üye` : "OtoBurada üyesi";

  return (
    <div className="w-full space-y-10 lg:w-[380px] lg:shrink-0">
      <Panel
        padding="xl"
        className="shadow-2xl lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center gap-6 mb-8 border-b border-border/40 pb-8">
          <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shadow-inner shrink-0">
            {(seller?.businessName || seller?.fullName || "?")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-foreground truncate tracking-tight mb-1">
              {seller?.businessName || seller?.fullName || "Bilinmeyen Satıcı"}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`flex h-5 items-center gap-1.5 rounded-md px-2 text-[10px] font-bold uppercase tracking-widest border ${
                  isTrusted
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : tone === "slate"
                      ? "bg-slate-500/10 text-slate-700 border-slate-500/20"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                }`}
              >
                <ShieldCheck size={12} strokeWidth={3} />
                {label}
              </div>
              <div className="flex h-5 items-center gap-1.5 rounded-md bg-muted px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                {seller?.userType === "professional" ? "Galeri" : "Bireysel"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold">
                {sellerRatingSummary.count > 0 ? sellerRatingSummary.average.toFixed(1) : "-"}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {sellerRatingSummary.count > 0 ? `${sellerRatingSummary.count} Yorum` : "Yorum Yok"}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <div className="flex items-center justify-center gap-1 text-foreground mb-1 font-bold text-sm">
              <CalendarDays size={14} className="text-primary" />
              {membershipLabel}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Üyelik
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {!isOwner && (
            <ContactActions
              listingId={listing.id}
              listingSlug={listing.slug}
              sellerId={listing.sellerId}
              seller={seller}
              currentUserId={currentUser?.id}
            />
          )}
          {/* Footer — single source, no duplicate with the grid above */}
          <div className="pt-6 border-t border-border/40 flex items-center justify-center gap-2 pb-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Store size={14} className="text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground">{memberSinceText}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
