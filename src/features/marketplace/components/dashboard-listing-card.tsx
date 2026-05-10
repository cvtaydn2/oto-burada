"use client";

import {
  Archive,
  ArrowUpCircle,
  Check,
  Loader2,
  Pencil,
  Rocket,
  RotateCcw,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DopingStore } from "@/features/dashboard/components/doping-store";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import {
  getListingDopingDisplayItems,
  getListingDopingStatusTone,
} from "@/features/marketplace/lib/utils";
import { trust } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { supabaseImageUrl } from "@/lib/utils/image";
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
  trustFilter?: "incomplete";
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
  trustFilter,
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
  const now = new Date(currentTime > 0 ? currentTime : 0);
  const hasExpertInspection = Boolean(listing.expertInspection?.hasInspection);
  const hasDamageDeclaration = Boolean(
    listing.damageStatusJson && Object.keys(listing.damageStatusJson).length > 0
  );
  const hasTramer = typeof listing.tramerAmount === "number";
  const trustChecklistItems = [
    {
      key: "expert-inspection",
      label: "Ekspertiz",
      completed: hasExpertInspection,
    },
    {
      key: "damage-declaration",
      label: "Hasar beyanı",
      completed: hasDamageDeclaration,
    },
    {
      key: "tramer",
      label: "Tramer",
      completed: hasTramer,
    },
  ] as const;
  const completedTrustItemCount = trustChecklistItems.filter((item) => item.completed).length;
  const isTrustIncomplete = completedTrustItemCount < trustChecklistItems.length;
  const shouldShowTrustReminder =
    isTrustIncomplete && ["draft", "pending", "approved"].includes(listing.status);

  const BUMP_COOLDOWN_HOURS = 24;

  const canBump =
    isApproved &&
    (() => {
      if (!listing.bumpedAt) return true;
      const cooldownEnd = new Date(
        new Date(listing.bumpedAt).getTime() + BUMP_COOLDOWN_HOURS * 60 * 60 * 1000
      );
      return now >= cooldownEnd;
    })();

  const bumpCooldownHours = listing.bumpedAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(listing.bumpedAt).getTime() +
            BUMP_COOLDOWN_HOURS * 60 * 60 * 1000 -
            now.getTime()) /
            (60 * 60 * 1000)
        )
      )
    : 0;

  const dopingItems = getListingDopingDisplayItems(listing);
  const trustQuery = trustFilter === "incomplete" ? "&trust=incomplete" : "";

  return (
    <div
      className={cn(
        "group rounded-2xl border transition-all duration-500",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/10"
          : "border-border/50 bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5",
        isArchived && "opacity-70 grayscale-[0.5]"
      )}
    >
      <div className="flex gap-3 p-3 sm:p-4">
        <div className="pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="size-4.5 rounded-lg border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary transition-all shadow-sm"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-sm transition-transform duration-500 group-hover:shadow-md sm:h-24 sm:w-36 lg:w-40">
              {listing.images?.[0]?.url ? (
                <Image
                  src={supabaseImageUrl(listing.images[0].url, 320, 75)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 160px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  placeholder={listing.images[0].placeholderBlur ? "blur" : "empty"}
                  blurDataURL={listing.images[0].placeholderBlur ?? undefined}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <Rocket size={24} />
                </div>
              )}
              {dopingItems[0] && (
                <div
                  className={cn(
                    "absolute left-2 top-2 rounded-lg px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-white shadow-lg backdrop-blur-sm",
                    getListingDopingStatusTone(dopingItems[0].expiresAt) === "expiring"
                      ? "bg-amber-500"
                      : "bg-primary"
                  )}
                >
                  {dopingItems[0].label}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm",
                    statusClassMap[listing.status]
                  )}
                >
                  {statusLabelMap[listing.status]}
                </span>
                {listing.status === "pending" && (
                  <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[8px] font-medium text-blue-600/80">
                    ~24 saat içinde sonuçlanır
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  {listing.brand}
                </span>
                {dopingItems.length > 1 && (
                  <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-primary">
                    +{dopingItems.length - 1} aktif boost
                  </span>
                )}
                {dopingItems[0] &&
                  getListingDopingStatusTone(dopingItems[0].expiresAt) === "expiring" && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-700">
                      Süresi bitiyor
                    </span>
                  )}
              </div>

              <div className="space-y-1.5">
                <p className="truncate text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
                  {listing.title}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-primary">
                    {formatCurrency(listing.price)}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-primary/40">TL</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
                <span>{listing.year}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{formatNumber(listing.mileage)} KM</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="truncate">{listing.city}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {listing.status === "approved" && !getSellerTrustUI(listing.seller).isTrusted && (
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-600 transition-all hover:bg-amber-500 hover:text-white"
                  >
                    <div className="size-1.5 rounded-full bg-current" />
                    <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                      Güveni Artır
                    </span>
                  </Link>
                )}

                {shouldShowTrustReminder && (
                  <Link
                    href={`/dashboard/listings?edit=${listing.id}&focus=trust${trustQuery}`}
                    className="w-full rounded-2xl border border-blue-200 bg-blue-50/85 px-3 py-3 text-left text-blue-900 transition-all hover:border-blue-300 hover:bg-blue-100/85 sm:w-auto sm:min-w-[320px]"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                            Güven detaylarını tamamla
                          </p>
                          <p className="text-xs font-medium leading-5 text-blue-900/85">
                            Alıcıların ilk bakışta göreceği 3 güven alanında eksik kalanları
                            tamamla.
                          </p>
                        </div>
                        <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                          {completedTrustItemCount}/3
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                        {trustChecklistItems.map((item) => (
                          <div
                            key={item.key}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] font-semibold leading-none transition-colors",
                              item.completed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-blue-200/80 bg-white/70 text-blue-900"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                                item.completed
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-blue-300 bg-blue-100 text-blue-700"
                              )}
                            >
                              {item.completed ? (
                                <Check className="size-3" />
                              ) : (
                                <span className="size-1.5 rounded-full bg-current" />
                              )}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-medium leading-4 text-blue-900/75">
                          Mevcut düzenleme akışında sadece eksik kalan alanlara odaklan.
                        </p>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                          Tamamla
                        </span>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Düzenleme ve öne çıkarma işlemlerini buradan hızlıca yönetebilirsin.
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Link
                href={`/dashboard/listings?edit=${listing.id}${trustQuery}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-3 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                aria-label="İlanı düzenle"
              >
                <Pencil className="size-4" />
                <span>Düzenle</span>
              </Link>

              {isApproved &&
                (!canBump ? (
                  <div
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/40 px-3 text-xs font-semibold text-muted-foreground/60"
                    title={`${bumpCooldownHours} saat sonra tekrar öne çıkarılabilir`}
                  >
                    <ArrowUpCircle className="size-4" />
                    <span>{bumpCooldownHours} saat kaldı</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => onBump(listing.id)}
                    disabled={isBumping}
                    aria-label="İlanı Üste Taşı"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-600 hover:text-white disabled:opacity-30"
                    title="Üste Taşı"
                  >
                    {isBumping ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUpCircle className="size-4" />
                    )}
                    <span>Üste taşı</span>
                  </Button>
                ))}

              <Button
                type="button"
                onClick={() => onArchive(listing.id)}
                disabled={isArchiving}
                aria-label={isArchived ? "Yeniden Yayına Al" : "Arşivle"}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-sm transition-all disabled:opacity-30",
                  isArchived
                    ? "border-slate-800 bg-slate-900 text-white hover:bg-slate-950"
                    : "border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
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
                <span>{isArchived ? "Yayına al" : "Arşivle"}</span>
              </Button>

              {isApproved && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      aria-label="Doping Al"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 text-xs font-semibold text-amber-700 shadow-sm transition-all hover:bg-amber-600 hover:text-white"
                      title="Doping Al"
                    >
                      <Zap className="size-4" />
                      <span>Doping al</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Doping Mağazası</DialogTitle>
                      <DialogDescription className="font-medium">
                        İlanınızı öne çıkarmak ve daha hızlı satmak için bir doping seçin.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                      <DopingStore listing={listing} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
