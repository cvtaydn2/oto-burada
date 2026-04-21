import { ShieldCheck, MessageSquare, Phone, Store, Star, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared/design-system/Panel";
import type { Listing, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface ListingSellerSidebarProps {
  listing: Listing;
  seller: Partial<Profile> | null;
  currentUser: User | null;
  sellerRatingSummary: { average: number; count: number } | null;
  membershipYears: number;
  memberSince: number;
}

export function ListingSellerSidebar({ 
  listing, 
  seller, 
  currentUser, 
  sellerRatingSummary, 
  membershipYears, 
  memberSince 
}: ListingSellerSidebarProps) {
  const isOwner = currentUser?.id === listing.sellerId;

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
              <div className="flex h-5 items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-500/20">
                <ShieldCheck size={12} strokeWidth={3} />
                ONAYLI
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
              <span className="text-sm font-bold">{sellerRatingSummary?.average?.toFixed(1) || "5.0"}</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Puan</p>
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
            <>
              <a href={`https://wa.me/${listing.whatsappPhone}?text=Merhaba, ${listing.title} ilanınızla ilgileniyorum.`} target="_blank" rel="noreferrer">
                <Button className="w-full h-16 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-base shadow-lg shadow-green-500/10 flex items-center justify-center gap-3 group transition-all">
                  <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                  WHATSAPP İLE SOR
                </Button>
              </a>
              <a href={`tel:${listing.whatsappPhone}`}>
                <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-border/60 font-bold text-base hover:bg-muted/50 flex items-center justify-center gap-3 group transition-all">
                  <Phone size={20} className="group-hover:rotate-12 transition-transform" />
                  HEMEN ARA
                </Button>
              </a>
            </>
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
