"use client";

import { CheckCircle2, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ContactActions } from "@/components/listings/contact-actions";
import { SellerRatingInfo } from "@/components/profile/seller-rating-info";
import { TrustBadge } from "@/components/shared/trust-badge";
import { trust } from "@/lib/constants/ui-strings";
import { cn } from "@/lib/utils";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import type { Profile } from "@/types";

interface SellerCardProps {
  seller: Profile | null;
  trustSummary: {
    badgeLabel: string;
    score: number;
    signals: string[];
  };
  isLoggedIn: boolean;
  listingId: string;
  listingTitle?: string;
  listingPrice?: number;
  loginUrl: string;
  ratingSummary?: { average: number; count: number };
}

export function SellerCard({
  seller,
  trustSummary,
  isLoggedIn,
  listingId,
  listingTitle,
  listingPrice,
  loginUrl,
  ratingSummary,
}: SellerCardProps) {
  const trustUI = getSellerTrustUI(seller);
  const isContactable = trustUI.isContactable && trustUI.isPremiumVisible;

  return (
    <div className="rounded-[40px] border border-border/50 bg-card overflow-hidden shadow-sm shadow-slate-200/20">
      <div className="p-8">
        {/* Seller Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="size-16 rounded-[20px] bg-muted/30 flex items-center justify-center font-bold text-2xl text-muted-foreground/70 border border-border/50 shrink-0 overflow-hidden relative">
            {seller?.businessLogoUrl ? (
              <Image
                src={seller.businessLogoUrl}
                alt={seller.businessName || seller.fullName || ""}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            ) : (
              (seller?.businessName || seller?.fullName || "S").slice(0, 1)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold font-heading text-foreground truncate">
                {seller?.businessName || seller?.fullName || "Bireysel Satıcı"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg tracking-widest italic",
                  trustUI.isPremiumVisible
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {trustUI.isPremiumVisible ? trust.professional : trust.individual}
              </span>

              {/* Quick response badge only for active, premium, contactable sellers */}
              {isContactable && trustSummary.score > 85 && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 italic">
                  HIZLI YANIT
                </span>
              )}

              {/* Gallery link only for active professional sellers */}
              {seller?.businessSlug && trustUI.isPremiumVisible && (
                <Link
                  href={`/galeri/${seller.businessSlug}`}
                  className="text-[10px] font-bold uppercase text-primary hover:underline italic tracking-widest"
                >
                  {"Profil ->"}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Trust & Rating - hidden for restricted/banned sellers */}
        {trustUI.restrictionState === "active" && (
          <div className="space-y-4 py-6 border-y border-slate-50">
            <SellerRatingInfo
              average={ratingSummary?.average || 0}
              count={ratingSummary?.count || 0}
            />
            <TrustBadge
              badgeLabel={trustSummary.badgeLabel}
              score={trustSummary.score}
              tone={trustUI.tone}
            />
          </div>
        )}

        {/* Contact Actions */}
        {isLoggedIn ? (
          <div className="mt-8">
            <ContactActions
              listingId={listingId}
              sellerId={seller?.id || ""}
              listingTitle={listingTitle}
              listingPrice={listingPrice}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="rounded-[28px] bg-muted/30 p-8 text-center border border-border/50 group">
              <div className="size-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center mx-auto mb-4 text-slate-300 group-hover:text-primary transition-colors">
                <Lock size={20} />
              </div>
              <p className="text-sm font-bold text-foreground mb-6 italic leading-relaxed">
                İletişim bilgilerini görmek için lütfen giriş yapın.
              </p>
              <Link
                href={loginUrl}
                className="w-full inline-flex items-center justify-center h-12 rounded-2xl bg-slate-900 text-sm font-bold text-white hover:bg-black transition-all uppercase tracking-widest italic"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        )}

        {/* Trust Signals - only for active sellers */}
        {trustUI.restrictionState === "active" && (
          <div className="mt-8 pt-8 border-t border-border/50">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 italic mb-4">
              Güven Sinyalleri
            </h4>
            {trustSummary.signals.length > 0 ? (
              <ul className="space-y-3">
                {trustSummary.signals.map((signal) => (
                  <li
                    key={signal}
                    className="flex items-center gap-3 text-xs font-bold text-muted-foreground italic"
                  >
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    {signal}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground font-medium italic">
                Ek sinyal bulunmuyor.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
