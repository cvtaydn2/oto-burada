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

import { SafeImage } from "@/components/shared/safe-image";
import { FavoriteButton } from "@/features/marketplace/components/favorite-button";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import {
  getListingBadgeStates,
  getListingCoverImage,
  getListingDopingDisplayItems,
} from "@/features/marketplace/lib/utils";
import { getListingCardInsights } from "@/features/marketplace/services/listing-card-insights";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { formatPrice } from "@/lib/utils/format";
import { supabaseImageUrl } from "@/lib/utils/image";
import { type Listing } from "@/types";

const cardVariants = cva(
  "group relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/95 shadow-sm shadow-slate-950/5 transition-[border-color,box-shadow,transform,background-color] duration-normal ease-standard hover:border-primary/18 hover:bg-card hover:shadow-[0_22px_50px_-24px_rgba(15,23,42,0.32)]",
  {
    variants: {
      variant: {
        grid: "flex h-full flex-col hover:-translate-y-1",
        list: "flex min-h-[220px] flex-col sm:flex-row hover:-translate-y-0.5",
        minimal: "flex flex-col border-none bg-transparent p-0 shadow-none hover:opacity-90",
      },
      isHighlighted: {
        true: "ring-1 ring-primary/25 bg-gradient-to-br from-primary/[0.045] via-card to-card shadow-[0_24px_54px_-30px_rgba(37,99,235,0.35)]",
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
        className="absolute inset-0 z-10 rounded-[1.25rem] focus:outline-none"
        aria-label={cardAriaLabel}
      />

      <div
        className={cn(
          "relative overflow-hidden bg-muted/30",
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
          className="object-cover transition-transform duration-slow ease-expressive group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/10 to-transparent opacity-90 transition-opacity duration-normal group-hover:opacity-75" />

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
              className="size-11 rounded-2xl border border-white/25 bg-slate-950/28 text-white backdrop-blur-xl shadow-xl shadow-slate-950/20 transition-[background-color,color,transform,border-color] duration-normal ease-expressive hover:border-white/50 hover:bg-white hover:text-rose-500 active:scale-90"
            />
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20 pointer-events-none">
          {showInsights && insights.tone === "emerald" && (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-emerald-900/20">
              <TrendingDown size={12} />
              {insights.badgeLabel}
            </div>
          )}
          <div className="rounded-xl border border-white/15 bg-slate-950/35 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md shadow-lg shadow-slate-950/20">
            {listing.images?.length || 0} foto
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative z-20 flex flex-1 flex-col",
          isGrid && "p-5 sm:p-6",
          isList && "justify-center p-4 sm:p-7 sm:pl-9"
        )}
      >
        <div className="space-y-4.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary/90">
                {listing.brand}
              </span>
              <div className="size-1 rounded-full bg-border" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {listing.year}
              </span>
            </div>
            {showInsights && insights.tone !== "emerald" && (
              <div
                className={cn(
                  "rounded-xl border px-2.5 py-1.5 text-[10px] font-bold tracking-wide shadow-sm",
                  insights.tone === "amber"
                    ? "border-amber-200/70 bg-amber-50 text-amber-800"
                    : insights.tone === "indigo"
                      ? "border-indigo-200/70 bg-indigo-50 text-indigo-800"
                      : "border-border/70 bg-muted/60 text-muted-foreground"
                )}
              >
                {insights.badgeLabel}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2
              id={`listing-title-${listing.id}`}
              className="text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl lg:text-[1.65rem]"
            >
              {listing.model}
            </h2>
            <p className="line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">
              {listing.title}
            </p>
          </div>

          <div
            className="flex items-end gap-1.5"
            aria-label={`Fiyat: ${formatPrice(listing.price)} TL`}
          >
            <span className="text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-[2rem]">
              {formatPrice(listing.price)}
            </span>
            <span
              className="pb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60"
              aria-hidden="true"
            >
              TL
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1.5">
            <Stat icon={CircleGauge} label={`${formatNumber(listing.mileage)} km`} />
            <Stat icon={Settings2} label={transmissionLabel} />
            <Stat icon={Fuel} label={fuelTypeLabel} />
          </div>
        </div>

        <div
          className={cn(
            "mt-6 flex items-center justify-between border-t border-border/70 pt-5",
            isList && "sm:mt-6"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-[background-color,color,border-color] duration-normal ease-standard group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
              <MapPin size={14} />
            </div>
            <span className="truncate text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              {listing.city}
            </span>
          </div>

          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary/90">
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
        "flex h-8 items-center gap-2 rounded-xl border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl",
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
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-muted/35 text-muted-foreground transition-[background-color,color,transform,border-color] duration-normal ease-standard group-hover:scale-[1.03] group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <div className="flex min-w-0 items-baseline gap-1">
        <span className="truncate text-[12px] font-semibold text-foreground/80">{label}</span>
        {sub && <span className="text-[9px] font-bold uppercase text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
