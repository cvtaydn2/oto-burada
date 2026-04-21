"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Store, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSellerTrustUI } from "@/lib/utils/trust-ui";

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
  idVerified
}: AdminUserHeaderProps) {
  const trustUI = getSellerTrustUI({ isBanned, banReason, trustScore, verificationStatus, isVerified: idVerified });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="group rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-900 hover:text-white ">
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
        {/* Trust Score Badge */}
        <div className={cn(
          "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.12em] shadow-sm border flex items-center gap-2.5",
          trustUI.tone === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
          trustUI.tone === "amber" ? "bg-amber-50 text-amber-700 border-amber-100" :
          trustUI.tone === "blue" ? "bg-blue-50 text-blue-700 border-blue-100" :
          "bg-rose-50 text-rose-700 border-rose-100"
        )}>
           <Shield size={14} />
           <span className="opacity-50">Güven:</span>
           <span className="text-sm tracking-tight">{trustScore}%</span>
        </div>

        <div className={cn(
          "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
          trustUI.tone === "emerald" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
          trustUI.tone === "amber" ? "bg-amber-50 text-amber-700 border-amber-100" :
          trustUI.tone === "blue" ? "bg-blue-50 text-blue-600 border-blue-100" :
          "bg-rose-50 text-rose-600 border-rose-100"
        )}>
          <div
            className={cn(
              "size-2 rounded-full",
              trustUI.tone === "rose" ? "bg-rose-500" :
              trustUI.tone === "amber" ? "bg-amber-500" :
              "bg-emerald-500 animate-pulse",
            )}
          />
          {trustUI.label}
        </div>
        
        <div className={cn(
          "px-5 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] shadow-sm border flex items-center gap-2",
          role === "admin" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"
        )}>
          <ShieldCheck size={14} strokeWidth={3} />
          {role === "admin" ? "ADMİN" : "ÜYE"}
        </div>
      </div>
    </div>
  );
}
