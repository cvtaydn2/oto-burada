"use client";

import { AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";
import { cn } from "@/lib/utils";

import { type Profile } from "@/types";

interface AccountTrustNoticeProps {
  seller: Partial<Profile> | null;
  className?: string;
}

export function AccountTrustNotice({ seller, className }: AccountTrustNoticeProps) {
  const trustUI = getSellerTrustUI(seller);
  
  // If no restriction and premium is visible, don't show a notice
  if (!trustUI.restrictionState && trustUI.isPremiumVisible) return null;

  const themes = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
    blue: "border-blue-100 bg-blue-50 text-blue-900",
    slate: "border-slate-100 bg-slate-50 text-slate-900",
    rose: "border-rose-100 bg-rose-50 text-rose-900",
  };

  const isBanned = trustUI.restrictionState === "banned";
  const tone = trustUI.tone as keyof typeof themes;

  return (
    <div className={cn(
      "rounded-2xl border p-4 shadow-sm transition-all animate-in fade-in slide-in-from-top-2",
      themes[tone] || themes.slate,
      className
    )}>
      <div className="flex gap-4">
        <div className={cn(
          "shrink-0 flex items-center justify-center size-10 rounded-xl",
          tone === "rose" ? "bg-rose-100 text-rose-600" : 
          tone === "amber" ? "bg-amber-100 text-amber-600" :
          tone === "blue" ? "bg-blue-100 text-blue-600" :
          "bg-slate-100 text-slate-600"
        )}>
          {isBanned ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-bold text-sm tracking-tight">
              {trustUI.label}
            </h4>
            {!isBanned && (
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                Güven Skoru: {seller?.trustScore || 0}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium opacity-80 leading-relaxed max-w-2xl">
            {trustUI.subMessage || "Hesabınız kısıtlama altındadır. Detaylar ve çözüm için destek ekibiyle iletişime geçin."}
          </p>
          
          {!isBanned && trustUI.restrictionState !== "restricted_review" && (
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
