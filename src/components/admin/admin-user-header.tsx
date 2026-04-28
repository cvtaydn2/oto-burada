"use client";

import { AlertTriangle, ArrowLeft, Shield, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getTrustDotColor, getTrustToneClass } from "@/lib/listings/trust-ui";
import { getSellerTrustUI } from "@/lib/listings/trust-ui";
import { cn } from "@/lib/utils";
import { type VerificationStatus } from "@/types";

interface AdminUserHeaderProps {
  userId: string;
  fullName: string;
  userType: string;
  isBanned: boolean;
  banReason?: string | null;
  role: string;
  trustScore?: number;
  verificationStatus?: VerificationStatus;
  idVerified?: boolean;
  restrictionState?: "active" | "restricted_review" | "banned";
}

export function AdminUserHeader({
  userId,
  fullName,
  userType,
  isBanned,
  banReason,
  role,
  trustScore = 0,
  verificationStatus,
  idVerified,
  restrictionState,
}: AdminUserHeaderProps) {
  const trustUI = getSellerTrustUI({
    isBanned,
    banReason,
    trustScore,
    verificationStatus,
    isVerified: idVerified,
  });

  const hasConflict =
    (verificationStatus === "approved" && isBanned) ||
    (verificationStatus === "approved" && restrictionState === "restricted_review");
  const conflictMessage = isBanned
    ? "ONAYLI + YASAKLI (ÇELİŞKİ)"
    : restrictionState === "restricted_review"
      ? "ONAYLI + İNCELEMEDE (ÇELİŞKİ)"
      : null;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <Link href="/admin/users">
          <Button
            variant="ghost"
            size="icon"
            className="group rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-900 hover:text-white "
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">
            {fullName || "İsimsiz Kullanıcı"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
              <Store size={12} strokeWidth={3} />
              {userType === "professional" ? "Kurumsal Üye" : "Bireysel Üye"}
            </div>
            <span className="text-[10px] text-slate-300 font-mono tracking-tighter">
              #{userId.substring(0, 12)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {hasConflict && (
          <div className="px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.12em] shadow-sm border flex items-center gap-2 bg-rose-600 text-white border-rose-500 animate-pulse">
            <AlertTriangle size={14} />
            {conflictMessage}
          </div>
        )}

        {/* Trust Score Badge */}
        <div
          className={cn(
            "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.12em] shadow-sm border flex items-center gap-2.5",
            getTrustToneClass(trustUI.tone, "badge")
          )}
        >
          <Shield size={14} />
          <span className="opacity-50">Güven:</span>
          <span className="text-sm tracking-tight">{trustScore}%</span>
        </div>

        <div
          className={cn(
            "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
            getTrustToneClass(trustUI.tone, "badge")
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              trustUI.tone === "rose" || trustUI.tone === "amber"
                ? getTrustDotColor(trustUI.tone)
                : "bg-emerald-500 animate-pulse"
            )}
          />
          {trustUI.label}
        </div>

        <div
          className={cn(
            "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
            role === "admin" || role === "super_admin"
              ? "bg-indigo-600 text-white border-indigo-500"
              : "bg-white text-slate-600 border-slate-200"
          )}
        >
          <ShieldCheck size={14} strokeWidth={3} />
          {role === "super_admin" ? "SÜPER ADMIN" : role === "admin" ? "ADMİN" : "ÜYE"}
        </div>
      </div>
    </div>
  );
}
