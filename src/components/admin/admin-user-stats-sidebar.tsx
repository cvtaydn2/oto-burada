"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Activity, CheckCircle2, Package, TrendingUp, User, Ban, Loader2, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, safeFormatDate } from "@/lib/utils";

interface AdminUserStatsSidebarProps {
  profile: any;
  listingCount: number;
  activeListingCount: number;
  featuredCount: number;
  isActioning: boolean;
  onBanToggle: () => void;
}

export function AdminUserStatsSidebar({ 
  profile, 
  listingCount, 
  activeListingCount, 
  featuredCount, 
  isActioning, 
  onBanToggle 
}: AdminUserStatsSidebarProps) {
  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kredi Bakiyesi</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">{profile.balanceCredits}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
          <StatItem icon={<Package size={16} />} label="Toplam İlan" value={listingCount} color="blue" />
          <StatItem icon={<CheckCircle2 size={16} />} label="Yayında" value={activeListingCount} color="emerald" />
          <StatItem icon={<Activity size={16} />} label="Dopingler" value={featuredCount} color="amber" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Shield size={18} className="text-indigo-500" />
          Güvenlik Matrisi
        </h3>
        <div className="space-y-4">
          <VerificationRow 
            label="E-Posta Doğrulama" 
            isDone={profile.emailVerified} 
            isCritical={true}
          />
          <VerificationRow 
            label="Kimlik Doğrulama" 
            isDone={profile.isVerified} 
          />
          <VerificationRow 
            label="Kurumsal Belge" 
            isDone={profile.verificationStatus === "approved"} 
            isVisible={profile.userType === "professional"}
          />
          <VerificationRow 
            label="Telefon Tanımlı" 
            isDone={!!profile.phone} 
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <User size={18} className="text-slate-400" />
          İletişim Detayları
        </h3>
        <div className="space-y-4">
          <InfoRow label="E-Posta" value={profile.email || "—"} />
          <InfoRow label="Telefon" value={profile.phone || "—"} />
          <InfoRow label="Lokasyon" value={profile.city || "—"} />
          <InfoRow label="Kayıt Tarihi" value={safeFormatDate(profile.createdAt, "dd MMMM yyyy")} />
        </div>
        
        <div className="pt-6 border-t border-slate-50">
          <Button
            onClick={onBanToggle}
            disabled={isActioning}
            variant="outline"
            className={cn(
              "w-full rounded-2xl font-bold text-[10px] tracking-widest h-12 flex items-center gap-2 transition-all uppercase shadow-sm",
              profile.isBanned ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-rose-200 text-rose-600 hover:bg-rose-50"
            )}
          >
            {isActioning ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            {profile.isBanned ? "YASAĞI KALDIR" : "HESABI ENGELLE"}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600"
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-50 transition-colors hover:bg-slate-100">
      <div className="flex items-center gap-3">
        <div className={cn("size-8 rounded-xl flex items-center justify-center shadow-sm", colorMap[color])}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-lg font-bold text-slate-900 tracking-tighter">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-xs font-bold text-slate-700 truncate">{value}</p>
    </div>
  );
}

function VerificationRow({ label, isDone, isCritical, isVisible = true }: { label: string; isDone?: boolean; isCritical?: boolean; isVisible?: boolean }) {
  if (!isVisible) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      {isDone ? (
        <CheckCircle2 size={14} className="text-emerald-500" />
      ) : (
        <XCircle size={14} className={cn(isCritical ? "text-rose-500" : "text-slate-200")} />
      )}
    </div>
  );
}
