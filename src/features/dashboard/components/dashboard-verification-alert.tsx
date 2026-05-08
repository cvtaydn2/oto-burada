import { AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getProfileRestrictionState } from "@/features/profile/services/profile-restrictions";
import { Button } from "@/features/ui/components/button";
import { trust } from "@/lib/ui-strings";
import type { Profile } from "@/types";

interface DashboardVerificationAlertProps {
  isEmailVerified?: boolean;
  profile?: Partial<Profile> | null;
}

export function DashboardVerificationAlert({
  isEmailVerified,
  profile,
}: DashboardVerificationAlertProps) {
  const restrictionState = getProfileRestrictionState(profile);

  // Case 1: Banned/Restricted
  if (restrictionState === "banned") {
    return (
      <section className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-rose-50 p-6 text-rose-700 border border-rose-100 md:flex-row shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold tracking-tight uppercase tracking-widest">
              {trust.accountRestrictedTitle}
            </h4>
            <p className="text-xs font-medium opacity-70 mt-1 max-w-lg leading-relaxed">
              {trust.accountRestrictedDesc}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Case 2: Restricted Review (Shadow Restriction)
  if (restrictionState === "restricted_review") {
    return (
      <section className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-amber-50 p-6 text-amber-700 border border-amber-100 md:flex-row shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold tracking-tight uppercase tracking-widest">
              {trust.accountUnderReview}
            </h4>
            <p className="text-xs font-medium opacity-70 mt-1 max-w-lg leading-relaxed">
              {trust.verificationPendingDesc}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Case 3: Email Verification (Legacy)
  if (!isEmailVerified) {
    return (
      <section className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-destructive/5 p-6 text-destructive border border-destructive/10 md:flex-row animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold tracking-tight">E-posta Adresini Doğrula</h4>
            <p className="text-xs font-medium opacity-70 mt-1 max-w-lg leading-relaxed">
              İlan verebilmek ve tüm özellikleri kullanabilmek için e-posta doğrulamanız gerekiyor.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="rounded-xl h-11 px-8 font-bold text-[10px] tracking-widest uppercase shadow-sm shadow-destructive/20 active:scale-95 transition-all"
          asChild
        >
          <Link href="/dashboard/profile">DOĞRULA</Link>
        </Button>
      </section>
    );
  }

  // Case 4: Trust Upsell (Verified Email but no Identity/Business)
  const isVerified = profile?.verificationStatus === "approved";
  const isPending = profile?.verificationStatus === "pending";

  if (!isVerified && !isPending) {
    return (
      <section className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-primary/5 p-6 text-primary border border-primary/10 md:flex-row shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight uppercase tracking-[0.05em]">
              {trust.benefits.title}
            </h4>
            <p className="text-xs font-medium opacity-70 mt-1 max-w-lg leading-relaxed">
              {trust.benefits.subtitle} <strong>{trust.benefits.motto}</strong>
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          className="rounded-xl h-11 px-8 font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          asChild
        >
          <Link href="/dashboard/profile">HEMEN BAŞLAT</Link>
        </Button>
      </section>
    );
  }

  return null;
}
