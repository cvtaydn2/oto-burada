"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CarFront,
  ExternalLink,
  Fuel,
  Gauge,
  Heart,
  LogIn,
  MapPin,
  Settings2,
  ShieldCheck,
  SortAsc,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import { cn, formatCurrency, formatNumber, formatPrice, supabaseImageUrl } from "@/lib/utils";
import type { Listing } from "@/types";

interface FavoritesPageClientProps {
  listings: Listing[];
  userId?: string;
}

type SortKey = "newest" | "price_asc" | "price_desc" | "mileage_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "En Yeni" },
  { value: "price_asc", label: "Fiyat (Düşük → Yüksek)" },
  { value: "price_desc", label: "Fiyat (Yüksek → Düşük)" },
  { value: "mileage_asc", label: "Kilometre (Az → Çok)" },
];

export function FavoritesPageClient({ listings, userId }: FavoritesPageClientProps) {
  const { favoriteIds, hydrated, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<SortKey>("newest");
  const isGuest = !userId;

  const favoriteListings = useMemo(
    () => listings.filter((l) => favoriteIds.includes(l.id)),
    [listings, favoriteIds],
  );

  const sortedListings = useMemo(() => {
    const copy = [...favoriteListings];
    switch (sort) {
      case "price_asc":   return copy.sort((a, b) => a.price - b.price);
      case "price_desc":  return copy.sort((a, b) => b.price - a.price);
      case "mileage_asc": return copy.sort((a, b) => a.mileage - b.mileage);
      default:            return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [favoriteListings, sort]);

  const stats = useMemo(() => {
    if (favoriteListings.length === 0) return null;
    const prices = favoriteListings.map((l) => l.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const withExpert = favoriteListings.filter((l) => l.expertInspection?.hasInspection).length;
    const lowMileage = favoriteListings.filter((l) => l.mileage <= 80_000).length;
    return { minPrice, maxPrice, avgPrice, withExpert, lowMileage };
  }, [favoriteListings]);

  if (!hydrated) return <ListingsGridSkeleton count={4} />;

  /* ── Empty state ── */
  if (favoriteListings.length === 0) {
    return (
      <div className="space-y-6">
        {isGuest && <GuestBanner />}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="mb-5 flex size-20 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Heart size={36} className="text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Henüz favori ilan yok</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
            İlanları gezerken kalp ikonuna tıklayarak buraya ekleyebilirsin.
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
          >
            İlanları Keşfet
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guest sync banner */}
      {isGuest && <GuestBanner compact />}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Takip Edilen"
            value={String(favoriteListings.length)}
            sub="ilan"
            icon={<Heart size={16} />}
            color="rose"
          />
          <StatCard
            label="Ort. Fiyat"
            value={formatCurrency(stats.avgPrice)}
            sub={`${formatCurrency(stats.minPrice)} – ${formatCurrency(stats.maxPrice)}`}
            icon={<TrendingUp size={16} />}
            color="blue"
          />
          <StatCard
            label="Ekspertizli"
            value={String(stats.withExpert)}
            sub={`${favoriteListings.length} ilandan`}
            icon={<ShieldCheck size={16} />}
            color="emerald"
          />
          <StatCard
            label="Düşük KM"
            value={String(stats.lowMileage)}
            sub="80.000 km altı"
            icon={<Gauge size={16} />}
            color="amber"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          <span className="font-bold text-foreground">{favoriteListings.length}</span> favori ilan
        </p>
        <div className="flex items-center gap-2">
          <SortAsc size={15} className="text-muted-foreground/70" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/90 outline-none focus:border-blue-400"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedListings.map((listing, i) => (
          <FavoriteCard
            key={listing.id}
            listing={listing}
            priority={i < 3}
            onRemove={() => toggleFavorite(listing.id)}
          />
        ))}
      </div>

      {/* Discover more */}
      <Link
        href="/listings"
        className="group flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 transition hover:border-blue-300 hover:shadow-sm"
      >
        <div>
          <p className="text-sm font-bold text-foreground">Daha fazla ilan keşfet</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Binlerce araç seni bekliyor</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground transition group-hover:bg-blue-600 group-hover:text-white">
          <ArrowRight size={18} />
        </div>
      </Link>
    </div>
  );
}

/* ── Favorite Card ─────────────────────────────────────────── */

function FavoriteCard({
  listing,
  priority,
  onRemove,
}: {
  listing: Listing;
  priority: boolean;
  onRemove: () => void;
}) {
  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0];
  const isAdvantageous = (listing.marketPriceIndex ?? 1) < 0.95;
  const hasExpert = listing.expertInspection?.hasInspection;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md hover:border-border/70">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {coverImage ? (
          <Image
            src={supabaseImageUrl(coverImage.url, 480, 80)}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-"
            priority={priority}
            placeholder={coverImage.placeholderBlur ? "blur" : "empty"}
            blurDataURL={coverImage.placeholderBlur ?? undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/50">
            <CarFront size={40} className="stroke-[1]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isAdvantageous && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              <TrendingDown size={10} /> AVANTAJLI
            </span>
          )}
          {hasExpert && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              <ShieldCheck size={10} /> EKSPERTİZLİ
            </span>
          )}
          {listing.featured && (
            <span className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              <Zap size={10} /> VİTRİN
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          title="Favorilerden kaldır"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>

        {/* Photo count */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
          {listing.images.length} FOTO
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
              {listing.brand} {listing.model}
            </p>
            <h3 className="mt-0.5 truncate text-sm font-bold text-foreground leading-tight">
              {listing.title}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-blue-600 leading-tight">
              {formatPrice(listing.price)}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/70">TL</p>
          </div>
        </div>

        {/* Specs */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-2.5">
          <SpecItem icon={<Gauge size={12} />} value={`${formatNumber(listing.mileage)} km`} />
          <SpecItem
            icon={<Settings2 size={12} />}
            value={listing.transmission === "yari_otomatik" ? "Yarı Oto." : listing.transmission}
          />
          <SpecItem icon={<Fuel size={12} />} value={listing.fuelType} />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MapPin size={11} className="text-muted-foreground/70" />
            {listing.city} · {listing.year}
          </span>
          <Link
            href={`/listing/${listing.slug}`}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100"
          >
            İncele
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Spec Item ─────────────────────────────────────────────── */

function SpecItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="text-center text-[10px] font-bold text-muted-foreground capitalize leading-tight">{value}</span>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────── */

type StatColor = "rose" | "blue" | "emerald" | "amber";

const colorMap: Record<StatColor, { bg: string; text: string; icon: string }> = {
  rose:    { bg: "bg-muted/30", text: "text-foreground", icon: "text-rose-500" },
  blue:    { bg: "bg-muted/30", text: "text-foreground", icon: "text-blue-500" },
  emerald: { bg: "bg-muted/30", text: "text-foreground", icon: "text-emerald-500" },
  amber:   { bg: "bg-muted/30", text: "text-foreground", icon: "text-amber-500" },
};

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: StatColor;
}) {
  const c = colorMap[color];
  return (
    <div className={cn("rounded-2xl border border-border/50 p-4", c.bg)}>
      <div className={cn("mb-2 flex size-8 items-center justify-center rounded-lg bg-card shadow-sm", c.icon)}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-xl font-bold leading-tight", c.text)}>{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/70 truncate">{sub}</p>
    </div>
  );
}

/* ── Guest Banner ──────────────────────────────────────────── */

function GuestBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-card text-blue-500 shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <p className="text-sm font-medium text-foreground/90">
            Favorileri tüm cihazlarda senkronize et
          </p>
        </div>
        <Link
          href="/login"
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/90"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
      <LogIn className="mx-auto mb-3 size-10 text-blue-500" />
      <h3 className="text-lg font-bold text-foreground">Bulut senkronizasyonu</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Favorilerin şu an sadece bu cihazda. Giriş yaparak tüm cihazlardan eriş.
      </p>
      <Link
        href="/login"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
      >
        <LogIn size={15} />
        Giriş Yap
      </Link>
    </div>
  );
}
