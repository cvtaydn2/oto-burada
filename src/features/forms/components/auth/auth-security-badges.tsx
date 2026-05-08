"use client";

import { CreditCard, Lock } from "lucide-react";

interface SecurityBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function SecurityBadge({ icon, label }: SecurityBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/30 tracking-widest">
      <div className="text-muted-foreground/20">{icon}</div>
      {label}
    </div>
  );
}

export function AuthSecurityBadges() {
  return (
    <div className="flex justify-center gap-8">
      <SecurityBadge icon={<Lock size={12} />} label="AES-256 GÜVENLİ" />
      <SecurityBadge icon={<CreditCard size={12} />} label="PCI-DSS UYUMLU" />
    </div>
  );
}
