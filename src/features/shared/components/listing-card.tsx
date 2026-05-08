import { cva, type VariantProps } from "class-variance-authority";
import {
  ChevronRight,
  CircleGauge,
  Fuel,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { FavoriteButton } from "@/features/marketplace/components/favorite-button";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import {
  getListingBadgeStates,
  getListingCoverImage,
  getListingDopingDisplayItems,
} from "@/features/marketplace/lib/utils";
import { getListingCardInsights } from "@/features/marketplace/services/listing-card-insights";
import { SafeImage } from "@/features/shared/components/safe-image";
import { cn, formatNumber, formatPrice, supabaseImageUrl } from "@/lib";
import { type Listing } from "@/types";

const cardVariants = cva(
  "group relative overflow-hidden transition-[border-color,box-shadow,transform] duration-normal ease-standard bg-card border border-border/50 shadow-sm rounded-2xl hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5",
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
      },
    },
    defaultVariants: {
      variant: "grid",
      isHighlighted: false,
    },
  }
);

const FUEL_TYPE_LABELS: Record<string, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  lpg: "LPG",
  hybrid: "Hibrit",
  elektrik: "Elektrikli",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  manuel: "Manuel",
  otomatik: "Otomatik",
  yari_otomatik: "Yarı Otomatik",
};

interface ListingCardProps extends VariantProps<typeof cardVariants> {
  listing: Listing;
  priority?: boolean;
  showFavorite?: boolean;
  showInsights?: boolean;
  className?: string;
}

export const ListingCard = memo(function ListingCard({
  listing,
  variant = "grid",
  priority = false,
  showFavorite = true,
  showInsights = true,
  className,
}: ListingCardProps) {
  const badgeStates = getListingBadgeStates(listing);
  const insights = getListingCardInsights(listing);
  const coverImage = getListingCoverImage(listing);
  const { isPremiumVisible } = getSellerTrustUI(listing.seller);
  const dopingItems = getListingDopingDisplayItems(listing);

  const detailHref = `/listing/${listing.slug}`;

  const isGrid = variant === "grid";
  const isList = variant === "list";
  const transmissionLabel =
    listing.transmission && TRANSMISSION_LABELS[listing.transmission]
      ? TRANSMISSION_LABELS[listing.transmission]
      : listing.transmission;
  const fuelTypeLabel =
    listing.fuelType && FUEL_TYPE_LABELS[listing.fuelType]
      ? FUEL_TYPE_LABELS[listing.fuelType]
      : listing.fuelType;
  const titleText = `${listing.year} ${listing.brand} ${listing.model}`;
  const cardAriaLabel = `${titleText}, ${listing.city}, ${formatPrice(listing.price)} TL`;

  return (
    <article
      className={cn(
        cardVariants({ variant, isHighlighted: badgeStates.isHighlighted && isPremiumVisible }),
        className
      )}
      aria-labelledby={`listing-title-${listing.id}`}
    >
      <Link
        href={detailHref}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={cardAriaLabel}
      />

      <div
        className={cn(
          "relative overflow-hidden bg-muted/20",
          isGrid && "aspect-[4/3] w-full",
          isList && "aspect-[16/10] sm:aspect-auto sm:w-[320px] shrink-0"
        )}
      >
        <SafeImage
          src={coverImage ? supabaseImageUrl(coverImage.url, 640) : ""}
          alt={`${titleText} görseli`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-slow ease-expressive group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-normal" />

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          {isPremiumVisible &&
            dopingItems
              .slice(0, 2)
              .map((item) => (
                <Badge
                  key={item.type}
                  icon={item.type === "urgent" ? Zap : Sparkles}
                  label={item.label}
                  className={
                    item.type === "urgent"
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                      : "bg-primary text-white shadow-lg shadow-primary/20"
                  }
                />
              ))}
          {isPremiumVisible && badgeStates.hasInspection && (
            <Badge
              icon={ShieldCheck}
              label="EKSPERTİZ"
              className="bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
            />
          )}
        </div>

        {showFavorite && (
          <div className="absolute top-4 right-4 z-30">
            <FavoriteButton
              listingId={listing.id}
              className="size-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white hover:text-rose-500 transition-[background-color,color,transform] duration-normal ease-expressive shadow-xl active:scale-90"
            />
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20 pointer-events-none">
          {showInsights && insights.tone === "emerald" && (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-xl">
              <TrendingDown size={12} />
              {insights.badgeLabel}
            </div>
          )}
          <div className="rounded-xl bg-black/30 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
            {listing.images?.length || 0} foto
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative z-20 flex flex-1 flex-col",
          isGrid && "p-5 sm:p-6",
          isList && "p-4 sm:p-8 sm:pl-10 justify-center"
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary">
                {listing.brand}
              </span>
              <div className="size-1 rounded-full bg-slate-300" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {listing.year}
              </span>
            </div>
            {showInsights && insights.tone !== "emerald" && (
              <div
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wide",
                  insights.tone === "amber"
                    ? "border-amber-100 bg-amber-50 text-amber-700"
                    : insights.tone === "indigo"
                      ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                      : "border-border/10 bg-muted/50 text-muted-foreground"
                )}
              >
                {insights.badgeLabel}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h2
              id={`listing-title-${listing.id}`}
              className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl"
            >
              {listing.model}
            </h2>
            <p className="line-clamp-1 text-sm font-medium text-muted-foreground">
              {listing.title}
            </p>
          </div>

          <div
            className="flex items-baseline gap-1.5"
            aria-label={`Fiyat: ${formatPrice(listing.price)} TL`}
          >
            <span className="text-3xl font-extrabold tracking-tighter text-foreground">
              {formatPrice(listing.price)}
            </span>
            <span className="text-xs font-bold tracking-wider text-primary/50" aria-hidden="true">
              TL
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <Stat icon={CircleGauge} label={`${formatNumber(listing.mileage)} km`} />
            <Stat icon={Settings2} label={transmissionLabel} />
            <Stat icon={Fuel} label={fuelTypeLabel} />
          </div>
        </div>

        <div
          className={cn(
            "mt-6 flex items-center justify-between border-t border-slate-100 pt-5",
            isList && "sm:mt-6"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-[background-color,color] duration-normal ease-standard group-hover:bg-primary/5 group-hover:text-primary">
              <MapPin size={14} />
            </div>
            <span className="truncate text-xs font-bold tracking-wide text-slate-500">
              {listing.city}
            </span>
          </div>

          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            Detay
            <ChevronRight size={16} strokeWidth={3} />
          </span>
        </div>
      </div>
    </article>
  );
});

function Badge({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-xl border border-white/20 px-4 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl",
        className
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
      {label}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/30 text-slate-400 transition-[background-color,color,transform] duration-normal ease-standard group-hover:scale-105 group-hover:bg-primary/5 group-hover:text-primary">
        <Icon size={16} />
      </div>
      <div className="flex min-w-0 items-baseline gap-1">
        <span className="truncate text-[12px] font-bold text-slate-600">{label}</span>
        {sub && <span className="text-[9px] font-bold uppercase text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}
