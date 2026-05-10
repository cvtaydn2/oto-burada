import type { User } from "@supabase/supabase-js";
import { BadgeCheck, ChevronRight, Clock3, ShieldCheck, Star, Store } from "lucide-react";
import Link from "next/link";

import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import type { Profile } from "@/types";

import { SellerReviewForm } from "../seller-review-form";
import { SellerTrustBadges } from "../seller-trust-badges";

interface ListingSellerInfoProps {
  seller: Partial<Profile> | null;
  membershipLabel?: string | null;
  sellerRating: { average: number; count: number };
  isOwner: boolean;
  currentUser: User | null;
  listingId: string;
}

export function ListingSellerInfo({
  seller,
  membershipLabel,
  sellerRating,
  isOwner,
  currentUser,
  listingId,
}: ListingSellerInfoProps) {
  const displayName = seller?.businessName || seller?.fullName || "Satıcı";
  const initial = displayName.charAt(0) || "?";
  const trustUI = getSellerTrustUI(seller);
  const sellerTypeLabel =
    seller?.userType === "professional" ? "Profesyonel satıcı" : "Bireysel satıcı";
  const sellerHighlights = [
    trustUI.isProfessional ? "Galeri profili ile yayınlıyor" : "Bireysel hesap ile yayınlıyor",
    membershipLabel ? `${membershipLabel} aktif` : null,
    sellerRating.count > 0
      ? `${sellerRating.count} değerlendirme mevcut`
      : "Henüz değerlendirme yok",
  ].filter((value): value is string => Boolean(value));

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary sm:size-12 sm:text-xl">
            {initial}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-bold text-foreground">{displayName}</div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                <ShieldCheck className="size-3" />
                {trustUI.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-semibold text-foreground/80">
                <Store className="size-3.5" />
                {sellerTypeLabel}
              </span>
              {membershipLabel ? (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3.5" />
                  {membershipLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
          <div className="mb-2 flex items-center gap-2 text-emerald-800">
            <BadgeCheck className="size-4" />
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Satıcı özeti</p>
          </div>
          <p className="text-sm font-semibold leading-6 text-foreground">
            {trustUI.isProfessional
              ? "Kurumsal profil ile yayın yapıyor. İletişim öncesi ilan detaylarını netleştirip ardından güvenli ödeme adımlarını teyit edebilirsin."
              : "Profil bilgileri ilan üzerinde açık şekilde görünüyor. İlk mesajda ekspertiz, hasar ve satış sürecini kısaca netleştirmen önerilir."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sellerHighlights.map((highlight) => (
              <span
                key={highlight}
                className="inline-flex items-center rounded-full border border-emerald-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-800"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        {sellerRating.count > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-foreground">
              {sellerRating.average.toFixed(1)}
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              ({sellerRating.count} değerlendirme)
            </span>
          </div>
        )}

        <SellerTrustBadges seller={seller} className="mt-4" />

        {seller?.businessSlug && (
          <Link
            href={`/galeri/${seller.businessSlug}`}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-muted text-xs font-bold text-foreground transition hover:bg-muted/80"
          >
            Tüm İlanları Gör
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {!isOwner && currentUser && (
        <SellerReviewForm
          sellerId={seller?.id || ""}
          listingId={listingId}
          sellerName={displayName}
        />
      )}
    </div>
  );
}
