"use client";

import { CreditCard, Lock } from "lucide-react";

interface SecurityBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function SecurityBadge({ icon, label }: SecurityBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm">
      <div className="text-primary">{icon}</div>
      <span>{label}</span>
    </div>
  );
}

export function AuthSecurityBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:justify-start">
      <SecurityBadge icon={<Lock size={14} />} label="Şifreli erişim" />
      <SecurityBadge icon={<CreditCard size={14} />} label="Güvenli oturum akışı" />
    </div>
  );
}
