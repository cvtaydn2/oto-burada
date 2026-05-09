"use client";

import { Shield, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { getTrustToneClass } from "@/features/marketplace/lib/trust-ui";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import { getListingCardInsights } from "@/features/marketplace/services/listing-card-insights";
import {} from "@/lib";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

interface ModerationInsightsProps {
  listing: Listing;
}

export function ModerationInsights({ listing }: ModerationInsightsProps) {
  const insight = getListingCardInsights(listing);

  const toneClasses: Record<string, string> = {
    amber: "border-amber-100 bg-amber-50/50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-700",
    indigo: "border-primary/10 bg-primary/5 text-primary",
    blue: "border-blue-100 bg-blue-50/50 text-blue-700",
    rose: "border-rose-100 bg-rose-50/50 text-rose-700",
  };
  const currentToneClass = toneClasses[insight.tone] || toneClasses.blue;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm",
            currentToneClass
          )}
        >
          {insight.badgeLabel}
        </span>
        {listing.expertInspection?.hasInspection && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-600 shadow-sm">
            <ShieldCheck className="size-3" /> EKSPERTİZLİ
          </span>
        )}

        {listing.seller &&
          (() => {
            const trustUI = getSellerTrustUI(listing.seller);
            return (
              <Link
                href={`/admin/users/${listing.seller.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold shadow-sm border transition-all hover:scale-105 active:scale-95",
                  getTrustToneClass(trustUI.tone)
                )}
              >
                <Shield size={12} />
                {trustUI.label} ({listing.seller.trustScore ?? "Kısıtlı"}) Skor
              </Link>
            );
          })()}
      </div>

      {/* AI Insights Panel */}
      <div className={cn("rounded-2xl border p-6 space-y-4 shadow-sm", currentToneClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest opacity-80">
            <Sparkles className="size-4" /> YAPAY ZEKA MODERASYON ANALİZİ
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-4 rounded-full",
                  i < 4 ? "bg-current opacity-40" : "bg-current opacity-10"
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-sm leading-relaxed font-medium">{insight.summary}</p>
        <div className="flex flex-wrap gap-2">
          {insight.highlights.map((highlight) => (
            <span
              key={`${listing.id}-${highlight}`}
              className="rounded-lg border border-border/20 bg-background/50 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>

      {/* Risks & Warnings */}
      {((listing.fraudScore ?? 0) > 0 || (listing.marketPriceIndex ?? 1) > 1.2) && (
        <div className="grid md:grid-cols-2 gap-4">
          {(listing.fraudScore ?? 0) > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-widest">
                <TriangleAlert className="size-4" /> GÜVENLİK RİSKİ ({listing.fraudScore})
              </div>
              <p className="text-xs font-medium text-rose-600 leading-relaxed">
                {listing.fraudReason || "Şüpheli kullanıcı davranışı veya veri tutarsızlığı."}
              </p>
            </div>
          )}
          {(listing.marketPriceIndex ?? 1) > 1.2 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                <TriangleAlert className="size-4" /> FİYAT ANALİZİ
              </div>
              <p className="text-xs font-medium text-amber-600 leading-relaxed">
                Piyasa ortalamasının %{Math.round(((listing.marketPriceIndex ?? 1) - 1) * 100)}{" "}
                üzerinde fiyatlandırılmış.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
