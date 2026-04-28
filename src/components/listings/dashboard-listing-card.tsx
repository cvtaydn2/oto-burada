"use client";

import { Archive, ArrowUpCircle, Loader2, Pencil, Rocket, RotateCcw, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { DopingStore } from "@/components/dashboard/doping-store";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trust } from "@/lib/constants/ui-strings";
import { getSellerTrustUI } from "@/lib/listings/trust-ui";
import { formatCurrency, formatNumber, supabaseImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

const statusLabelMap: Record<Listing["status"], string> = {
  approved: trust.admin.listingStatus.approved,
  archived: trust.admin.listingStatus.archived,
  draft: trust.admin.listingStatus.draft,
  pending: trust.admin.listingStatus.pending,
  pending_ai_review: trust.admin.listingStatus.pending_ai_review,
  flagged: trust.admin.listingStatus.flagged,
  rejected: trust.admin.listingStatus.rejected,
};

const statusClassMap: Record<Listing["status"], string> = {
  approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  archived: "bg-muted text-muted-foreground border-border",
  draft: "bg-amber-50 text-amber-600 border-amber-100",
  pending: "bg-blue-50 text-blue-600 border-blue-100",
  pending_ai_review: "bg-indigo-50 text-indigo-600 border-indigo-100",
  flagged: "bg-rose-50 text-rose-600 border-rose-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
};

interface DashboardListingCardProps {
  listing: Listing;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isArchiving?: boolean;
  isBumping?: boolean;
  currentTime?: number;
  onArchive: (id: string) => void;
  onBump: (id: string) => void;
}

export function DashboardListingCard({
  listing,
  isSelected = false,
  onToggleSelect,
  isArchiving = false,
  isBumping = false,
  currentTime = 0,
  onArchive,
  onBump,
}: DashboardListingCardProps) {
  const isArchived = listing.status === "archived";
  const isApproved = listing.status === "approved";
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => new Date(currentTime || Date.now()), [currentTime]);

  const canBump =
    isApproved &&
    (() => {
      if (!listing.bumpedAt) return true;
      const cooldownEnd = new Date(new Date(listing.bumpedAt).getTime() + 7 * 24 * 60 * 60 * 1000);
      return now >= cooldownEnd;
    })();

  const bumpCooldownDays = listing.bumpedAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(listing.bumpedAt).getTime() + 7 * 24 * 60 * 60 * 1000 - currentTime) /
            (24 * 60 * 60 * 1000)
        )
      )
    : 0;

  return (
    <div
      className={cn(
        "group flex gap-3 rounded-2xl border transition-all duration-500",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/10"
          : "border-border/50 bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5",
        isArchived && "opacity-70 grayscale-[0.5]"
      )}
    >
      {/* ── Selection Area ── */}
      <div className="flex items-start pt-4 pl-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="size-4.5 rounded-lg border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shadow-sm"
        />
      </div>

      <div className="flex flex-1 flex-col sm:flex-row gap-4 p-4 pl-0">
        {/* ── Thumbnail ── */}
        <div className="relative h-24 w-full sm:w-36 shrink-0 overflow-hidden rounded-xl bg-muted/30 border border-border/40 shadow-sm transition-transform duration-500 group-hover:shadow-md">
          {listing.images?.[0]?.url ? (
            <Image
              src={supabaseImageUrl(listing.images[0].url, 320, 75)}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 144px"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              placeholder={listing.images[0].placeholderBlur ? "blur" : "empty"}
              blurDataURL={listing.images[0].placeholderBlur ?? undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Rocket size={24} />
            </div>
          )}
          {listing.featured && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-primary text-white text-[8px] font-bold uppercase tracking-[0.15em] shadow-lg backdrop-blur-sm">
              ÖNE ÇIKAN
            </div>
          )}
        </div>

        {/* ── Core Info ── */}
        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm",
                statusClassMap[listing.status]
              )}
            >
              {statusLabelMap[listing.status]}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
              {listing.brand}
            </span>
          </div>

          <p className="font-bold text-foreground text-base tracking-tight truncate group-hover:text-primary transition-colors">
            {listing.title}
          </p>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-primary tracking-tight">
              {formatCurrency(listing.price)}
            </span>
            <span className="text-[10px] font-bold text-primary/40 uppercase">TL</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 overflow-hidden">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.1em]">
              <span>{listing.year}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{formatNumber(listing.mileage)} KM</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="truncate">{listing.city}</span>
            </div>

            {/* Contextual Funnel Nudge */}
            {listing.status === "approved" && !getSellerTrustUI(listing.seller).isTrusted && (
              <Link
                href="/dashboard/profile"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all animate-pulse"
              >
                <div className="size-1.5 rounded-full bg-amber-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                  Güveni Artır
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex sm:flex-col gap-2 justify-end sm:justify-center pt-2 sm:pt-0 sm:pl-4 sm:border-l sm:border-border/40">
          <Link
            href={`/dashboard/listings?edit=${listing.id}`}
            className="flex items-center justify-center size-11 rounded-xl bg-card border border-border/50 text-muted-foreground/70 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm group/btn"
            aria-label="İlanı düzenle"
          >
            <Pencil className="size-4" />
          </Link>

          {isApproved &&
            (!canBump ? (
              <div
                className="flex items-center justify-center size-11 rounded-xl bg-muted/40 text-slate-300 border border-border/30 cursor-help"
                title={`${bumpCooldownDays} gün sonra tekrar öne çıkarılabilir`}
              >
                <ArrowUpCircle className="size-4" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onBump(listing.id)}
                disabled={isBumping}
                className="flex items-center justify-center size-11 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30 border border-emerald-100 shadow-sm"
                title="Üste Taşı"
              >
                {isBumping ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="size-4" />
                )}
              </button>
            ))}

          <button
            type="button"
            onClick={() => onArchive(listing.id)}
            disabled={isArchiving}
            className={cn(
              "flex items-center justify-center size-11 rounded-xl transition-all disabled:opacity-30 border shadow-sm",
              isArchived
                ? "bg-slate-900 border-slate-800 text-white hover:bg-slate-950"
                : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white"
            )}
            title={isArchived ? "Yeniden Yayına Al" : "Arşivle"}
          >
            {isArchiving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isArchived ? (
              <RotateCcw className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
          </button>

          {isApproved && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center size-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                  title="Doping Al"
                >
                  <Zap className="size-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Doping Mağazası</DialogTitle>
                  <DialogDescription className="font-medium">
                    İlanınızı öne çıkarmak ve daha hızlı satmak için bir doping seçin.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                  <DopingStore listingId={listing.id} />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
