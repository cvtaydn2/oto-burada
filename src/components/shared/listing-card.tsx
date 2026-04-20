"use client";

import Link from "next/link";
import { 
  Calendar, 
  CircleGauge, 
  Fuel, 
  MapPin, 
  Settings2, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Info
} from "lucide-react";
import { cn, formatNumber, formatPrice, supabaseImageUrl } from "@/lib/utils";
import { type Listing } from "@/types";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { SafeImage } from "@/components/shared/safe-image";
import { getListingCardInsights } from "@/services/listings/listing-card-insights";
import { getListingBadgeStates, getListingCoverImage } from "@/lib/utils/listing-logic";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "group relative overflow-hidden transition-all duration-500 ease-in-out",
  {
    variants: {
      variant: {
        grid: "flex flex-col bg-card border border-border/50 rounded-2xl hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        list: "flex flex-col sm:flex-row bg-card border border-border/40 rounded-2xl hover:shadow-lg hover:bg-primary/[0.01]",
        minimal: "flex flex-col bg-transparent border-none p-0 hover:opacity-90",
      },
      isHighlighted: {
        true: "ring-2 ring-primary/20 bg-gradient-to-br from-primary/[0.02] to-card",
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
        "relative overflow-hidden bg-muted",
        isGrid && "aspect-[4/3]",
        isList && "aspect-[16/10] sm:aspect-auto sm:w-[320px] shrink-0",
      )}>
        <Link href={detailHref} className="block w-full h-full relative">
          <SafeImage
            src={coverImage ? supabaseImageUrl(coverImage.url, 640) : ""}
            alt={listing.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
        </Link>

        {/* Floating Badges (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {badgeStates.isFeatured && (
            <Badge icon={Sparkles} label="Vitrin" className="bg-blue-600/90 text-white shadow-sm" />
          )}
          {badgeStates.isUrgent && (
            <Badge icon={Zap} label="Acil" className="bg-rose-600/90 text-white shadow-sm" />
          )}
          {showTrust && badgeStates.hasInspection && (
            <Badge icon={ShieldCheck} label="Ekspertizli" className="bg-emerald-600/90 text-white shadow-sm" />
          )}
        </div>

        {/* Favorite Button (Top Right) */}
        {showFavorite && (
          <div className="absolute top-3 right-3 z-20">
            <FavoriteButton
              listingId={listing.id}
              className="size-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-rose-500 transition-all duration-300"
            />
          </div>
        )}

        {/* Image Count / Location Chips (Bottom) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
          <div className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-[9px] font-bold text-white/90 uppercase tracking-widest">
            {listing.images?.length || 0} FOTO
          </div>
        </div>

        {/* Floating Price Index (Bottom Left Insight) */}
        {showInsights && badgeStates.isAdvantageous && (
          <div className="absolute bottom-3 left-3 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/90 text-white backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest shadow-sm">
              <TrendingDown size={10} />
              Fırsat Fiyat
            </div>
          </div>
        )}
      </div>

      {/* ── Content Section ── */}
      <div className={cn(
        "flex flex-1 flex-col",
        isGrid && "p-5",
        isList && "p-6 sm:pl-8 justify-between",
      )}>
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between gap-4 mb-1">
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">{listing.brand}</span>
               <span className="w-1 h-1 rounded-full bg-border" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{listing.year}</span>
             </div>
             {showInsights && (
               <div className={cn(
                 "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                 insights.tone === "emerald" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                 insights.tone === "amber" ? "bg-amber-50 text-amber-600 border-amber-100" :
                 "bg-muted text-muted-foreground border-border/50"
               )}>
                 {insights.badgeLabel}
               </div>
             )}
          </div>

          <Link href={detailHref} className="block group/title">
            <h2 className="text-xl font-bold text-foreground tracking-tight line-clamp-1 group-hover/title:text-primary transition-colors">
              {listing.model}
            </h2>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1 mt-0.5 italic">
              {listing.title}
            </p>
          </Link>

          {/* Pricing Section */}
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatPrice(listing.price)}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">TL</span>
          </div>

          {/* Stats Bar */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat icon={CircleGauge} label={formatNumber(listing.mileage)} sub="KM" />
            <Stat icon={Settings2} label={listing.transmission === "otomatik" ? "Otomatik" : "Manuel"} />
            <Stat icon={Fuel} label={listing.fuelType === "benzin" ? "Benzin" : "Dizel"} />
          </div>
        </div>

        {/* Footer Area */}
        <div className={cn(
          "mt-6 flex items-center justify-between pt-4 border-t border-border/40",
          isList && "sm:mt-0"
        )}>
          <div className="flex items-center gap-1.5">
            <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <MapPin size={12} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              {listing.city}
            </span>
          </div>

          <Link 
            href={detailHref}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-primary hover:gap-3 transition-all cursor-pointer"
          >
            İncele
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, className }: { icon: any, label: string, className?: string }) {
  return (
    <div className={cn(
      "flex h-6 items-center gap-1.5 rounded-md px-2.5 text-[9px] font-bold uppercase tracking-widest backdrop-blur-xl",
      className
    )}>
      <Icon size={12} className="opacity-80" />
      {label}
    </div>
  );
}

function Stat({ icon: Icon, label, sub }: { icon: any, label: string, sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="size-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground/60 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
        <Icon size={14} />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-[11px] font-bold text-foreground truncate max-w-full">{label}</span>
        {sub && <span className="text-[8px] font-bold text-muted-foreground uppercase">{sub}</span>}
      </div>
    </div>
  );
}
