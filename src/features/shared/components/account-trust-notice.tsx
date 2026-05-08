"use client";

import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getTrustIconBg, getTrustStyles } from "@/features/marketplace/lib/trust-ui";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import { cn } from "@/lib";
import { type Profile } from "@/types";

interface AccountTrustNoticeProps {
  seller: Partial<Profile> | null;
  className?: string;
}

export function AccountTrustNotice({ seller, className }: AccountTrustNoticeProps) {
  const trustUI = getSellerTrustUI(seller);

  if (!trustUI.restrictionState && trustUI.isPremiumVisible) return null;

  const styles = getTrustStyles(trustUI.tone);
  const isUserBanned = trustUI.restrictionState === "banned";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition-all animate-in fade-in slide-in-from-top-2",
        styles,
        className
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "shrink-0 flex items-center justify-center size-10 rounded-xl",
            getTrustIconBg(trustUI.tone)
          )}
        >
          {isUserBanned ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-bold text-sm tracking-tight">{trustUI.label}</h4>
            {!isUserBanned && (
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                Güven Skoru: {seller?.trustScore || 0}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium opacity-80 leading-relaxed max-w-2xl">
            {trustUI.subMessage ||
              "Hesabınız kısıtlama altındadır. Detaylar ve çözüm için destek ekibiyle iletişime geçin."}
          </p>

          {!isUserBanned && trustUI.restrictionState !== "restricted_review" && (
            <div className="mt-4">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg bg-white/50 hover:bg-white border border-current/10 transition-all"
              >
                Profilini Doğrula
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
