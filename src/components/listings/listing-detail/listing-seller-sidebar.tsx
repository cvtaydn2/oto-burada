import { ShieldCheck, MessageSquare, Phone, Store, Star, CalendarDays } from "lucide-react";
import { trust } from "@/lib/constants/ui-strings";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared/design-system/Panel";
import { getSellerRatingSummary } from "@/services/profile/seller-reviews";
import { getMemberSinceYear, getMembershipYears } from "@/lib/utils/listing-utils";
import { getProfileRestrictionState } from "@/services/profile/profile-restrictions";
import type { Listing, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";
import { ContactActions } from "@/components/listings/contact-actions";


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
  const { label, isTrusted, tone, isContactable } = getSellerTrustUI(seller);

  return (
    <div className="w-full lg:w-[400px] space-y-10 shrink-0">
      <Panel padding="xl" className="sticky top-24">
        <div className="flex items-center gap-6 mb-8 border-b border-border/40 pb-8">
          <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shadow-inner">
            {(seller?.businessName || seller?.fullName || "?")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-foreground truncate tracking-tight mb-1">
              {seller?.businessName || seller?.fullName || "Bilinmeyen Satıcı"}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`flex h-5 items-center gap-1.5 rounded-md px-2 text-[10px] font-bold uppercase tracking-widest border ${
                isTrusted
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : tone === "slate"
                    ? "bg-slate-500/10 text-slate-700 border-slate-500/20"
                    : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              }`}>
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
              {membershipYears} Yıl
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Üyelik</p>
          </div>
        </div>

        <div className="space-y-4">
          {!isOwner && (
            <ContactActions 
              listingId={listing.id} 
              listingSlug={listing.slug} 
              sellerId={listing.sellerId} 
              seller={seller}
              currentUserId={currentUser?.id}
            />
          )}
          <div className="pt-4 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SHOWROOM STANDARTI</p>
            <div className="flex items-center gap-1">
              <Store size={14} className="text-primary" />
              <span className="text-xs font-bold text-foreground">{memberSince}’den beri OtoBurada üyesi</span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
