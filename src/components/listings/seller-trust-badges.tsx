"use client";

import { Award, Calendar, ShieldCheck, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Profile } from "@/types";

interface SellerTrustBadgesProps {
  seller: Partial<Profile> | null | undefined;
  className?: string;
}

export function SellerTrustBadges({ seller, className }: SellerTrustBadgesProps) {
  if (!seller) return null;

  const badges = [];

  // 1. Verification Badge
  if (seller.isVerified || seller.verificationStatus === "approved") {
    badges.push({
      id: "verified",
      label: "Onayli Profil",
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      description: "Kimlik veya isletme dogrulamasi tamamlanmis.",
    });
  }

  // 2. Old Member Badge
  if (seller.createdAt) {
    const joinedDate = new Date(seller.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      badges.push({
        id: "old-member",
        label: "Eski Uye",
        icon: Calendar,
        color: "bg-amber-50 text-amber-600 border-amber-100",
        description: "1 yildan uzun suredir OtoBurada uyesi.",
      });
    }
  }

  // 3. Professional Badge
  if (seller.userType === "professional") {
    badges.push({
      id: "pro",
      label: "Kurumsal",
      icon: Award,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Yetki belgesine sahip kurumsal satici.",
    });
  }

  // 4. High Trust Score
  if (seller.trustScore && seller.trustScore >= 80) {
    badges.push({
      id: "trusted",
      label: "Guvenilir Satici",
      icon: Star,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Yuksek guven puani ve basarili islemler.",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          title={badge.description}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-sm cursor-help",
            badge.color
          )}
        >
          <badge.icon size={12} className="shrink-0" />
          {badge.label}
        </div>
      ))}
    </div>
  );
}
