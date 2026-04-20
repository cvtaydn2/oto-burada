

import Link from "next/link";
import { 
  CircleGauge, 
  Fuel, 
  MapPin, 
  Settings2, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { cn, formatNumber, formatPrice, supabaseImageUrl } from "@/lib/utils";
import { type Listing } from "@/types";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { SafeImage } from "@/components/shared/safe-image";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { getListingBadgeStates, getListingCoverImage } from "@/lib/utils/listing-logic";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "group relative overflow-hidden transition-all duration-500 ease-in-out showroom-card",
  {
    variants: {
      variant: {
        grid: "flex flex-col h-full hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5",
        list: "flex flex-col sm:flex-row min-h-[220px] hover:shadow-xl hover:bg-primary/[0.01]",
        minimal: "flex flex-col border-none p-0 bg-transparent shadow-none hover:opacity-90",
      },
      isHighlighted: {
        true: "ring-2 ring-primary/20 bg-gradient-to-br from-primary/[0.03] to-card",
        false: "",
      }
    },
    defaultVariants: {
      variant: "grid",
      isHighlighted: false,
    },
  }
);

interface ListingCardProps extends VariantProps<typeof cardVariants> {
  listing: Listing;
  priority?: boolean;
  showFavorite?: boolean;
  showInsights?: boolean;
  showTrust?: boolean;
  className?: string;
}

export function ListingCard({
  listing,
  variant = "grid",
  priority = false,
  showFavorite = true,
  showInsights = true,
  showTrust = true,
  className,
}: ListingCardProps) {
  const badgeStates = getListingBadgeStates(listing);
  const insights = getListingCardInsights(listing);
  const coverImage = getListingCoverImage(listing);
  const detailHref = `/listing/${listing.slug}`;

  const isGrid = variant === "grid";
  const isList = variant === "list";

  return (
    <div className={cn(cardVariants({ variant, isHighlighted: badgeStates.isHighlighted }), className)}>
      {/* ── Media Section ── */}
      <div className={cn(
        "relative overflow-hidden bg-muted/20",
        isGrid && "aspect-[4/3] w-full",
        isList && "aspect-[16/10] sm:aspect-auto sm:w-[320px] shrink-0",
      )}>
        <Link href={detailHref} className="block w-full h-full relative">
          <SafeImage
            src={coverImage ? supabaseImageUrl(coverImage.url, 640) : ""}
            alt={listing.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          />
          {/* Glass Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500" />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
          {badgeStates.isFeatured && (
            <Badge icon={Sparkles} label="VİTRİN" className="bg-primary text-white shadow-lg shadow-primary/20" />
          )}
          {badgeStates.isUrgent && (
            <Badge icon={Zap} label="ACİL" className="bg-rose-600 text-white shadow-lg shadow-rose-600/20" />
          )}
          {showTrust && badgeStates.hasInspection && (
            <Badge icon={ShieldCheck} label="EKSPERTİZLİ" className="bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" />
          )}
        </div>

        {/* Favorite Button */}
        {showFavorite && (
          <div className="absolute top-4 right-4 z-20">
            <FavoriteButton
              listingId={listing.id}
              className="size-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white hover:text-rose-500 transition-all duration-500 shadow-xl"
            />
          </div>
        )}

        {/* Price Tag Overlay (Bottom Left on Grid) */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
          {showInsights && badgeStates.isAdvantageous && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white backdrop-blur-md text-[10px] font-bold uppercase tracking-widest shadow-xl">
              <TrendingDown size={12} />
              FIRSAT
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-[0.2em]">
            {listing.images?.length || 0} FOTO
          </div>
        </div>
      </div>

      {/* ── Content Section ── */}
      <div className={cn(
        "flex flex-1 flex-col",
        isGrid && "p-6",
        isList && "p-8 sm:pl-10 justify-center",
      )}>
        <div className="space-y-4">
          {/* Brand & Market Intelligence */}
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <span className="text-[11px] font-extrabold text-primary uppercase tracking-[0.25em]">{listing.brand}</span>
               <div className="size-1 rounded-full bg-slate-300" />
               <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{listing.year}</span>
             </div>
             {showInsights && (
               <div className={cn(
                 "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm",
                 insights.tone === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                 insights.tone === "amber" ? "bg-amber-50 text-amber-700 border-amber-100" :
                 "bg-muted/50 text-muted-foreground border-border/10"
               )}>
                 {insights.badgeLabel}
               </div>
             )}
          </div>

          {/* Title & Description */}
          <Link href={detailHref} className="block group/title space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight line-clamp-1 group-hover/title:text-primary transition-colors duration-300">
              {listing.model}
            </h2>
            <p className="text-sm font-medium text-slate-400 line-clamp-1 italic group-hover/title:text-slate-500 transition-colors">
              {listing.title}
            </p>
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tighter text-foreground">
              {formatPrice(listing.price)}
            </span>
            <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">TL</span>
          </div>

          {/* Key Technical Specs */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Stat icon={CircleGauge} label={formatNumber(listing.mileage)} sub="KM" />
            <Stat icon={Settings2} label={listing.transmission === "otomatik" ? "Otomatik" : "Manuel"} />
            <Stat icon={Fuel} label={listing.fuelType === "benzin" ? "Benzin" : "Dizel"} />
          </div>
        </div>

        {/* Footer / Location */}
        <div className={cn(
          "mt-8 flex items-center justify-between pt-6 border-t border-slate-100",
          isList && "sm:mt-6"
        )}>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500">
              <MapPin size={14} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              {listing.city}
            </span>
          </div>

          <Link 
            href={detailHref}
            className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary group-hover:gap-3 transition-all cursor-pointer"
          >
            DETAY
            <ChevronRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, className }: { icon: React.ElementType, label: string, className?: string }) {
  return (
    <div className={cn(
      "flex h-8 items-center gap-2 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl border border-white/20",
      className
    )}>
      <Icon size={14} strokeWidth={2.5} />
      {label}
    </div>
  );
}

function Stat({ icon: Icon, label, sub }: { icon: React.ElementType, label: string, sub?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="size-10 rounded-2xl bg-muted/30 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500">
        <Icon size={16} />
      </div>
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-[12px] font-bold text-slate-600 truncate">{label}</span>
        {sub && <span className="text-[9px] font-bold text-slate-400 uppercase">{sub}</span>}
      </div>
    </div>
  );
}
