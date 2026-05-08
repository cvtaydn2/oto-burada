import { Building2, CheckCircle2, Mail, Phone, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

import { updateProfileAction } from "@/features/auth/lib/profile-actions";
import { requireUser } from "@/features/auth/lib/session";
import { IdentityVerificationForm } from "@/features/forms/components/identity-verification-form";
import { ProfileForm } from "@/features/forms/components/profile-form";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import {
  buildProfileFromAuthUser,
  getStoredProfileById,
} from "@/features/profile/services/profile-records";
import {
  getLiveMarketplaceReferenceData,
  mergeCityOptions,
} from "@/features/shared/services/live-reference-data";
import { cn } from "@/lib";
import { trust } from "@/lib/ui-strings";
import { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const user = await requireUser();

  const [storedProfile, references] = await Promise.all([
    getStoredProfileById(user.id),
    getLiveMarketplaceReferenceData(),
  ]);
  const profile = storedProfile ?? buildProfileFromAuthUser(user);
  const cityOptions = mergeCityOptions(references.cities, [profile.city]);

  const hasFullName = Boolean(profile.fullName);
  const hasPhone = Boolean(profile.phone);
  const hasCity = Boolean(profile.city);
  const completion = Math.round(
    ([hasFullName, hasPhone, hasCity].filter(Boolean).length / 3) * 100
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="text-muted-foreground" size={14} />
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Yönetim Merkezi
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Hesap & Profil</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Hesap bilgilerinizi ve doğrulama durumunuzu yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xl font-bold text-foreground">{completion}%</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              Profil Tamamlandı
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          {/* Verification Status */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Doğrulama Durumu</h3>
            </div>
            <div className="grid gap-2">
              <VerificationItem label="E-posta" isVerified={profile.emailVerified} />
              <VerificationItem label="İşletme Profili" profile={profile} />
              <VerificationItem label="Kimlik (Yakında)" isVerified={false} isPending={true} />
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">İletişim Bilgileri</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                <Mail size={14} className="text-muted-foreground/70 shrink-0" />
                <span className="text-sm font-medium text-foreground/90 truncate">
                  {user.email}
                </span>
              </div>
              {hasPhone && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <Phone size={14} className="text-muted-foreground/70 shrink-0" />
                  <span className="text-sm font-medium text-foreground/90">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Corporate Link */}
          <Link
            href="/dashboard/profile/corporate"
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Kurumsal Mağaza</h4>
                <p className="text-xs text-muted-foreground">Ticarî araç alım satımı için</p>
              </div>
            </div>
            <ShieldCheck size={18} className="text-primary shrink-0" />
          </Link>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Kimlik Bilgileri</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Bireysel bilgileriniz ilanlarınızda görünür.
                </p>
              </div>
            </div>

            <ProfileForm
              action={updateProfileAction}
              initialValues={{
                fullName: profile.fullName,
                phone: profile.phone,
                city: profile.city,
                avatarUrl: profile.avatarUrl ?? "",
              }}
              cityOptions={cityOptions.map((item) => item.city)}
              isEmailVerified={profile.emailVerified}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={18} className="text-primary" />
              <div>
                <h3 className="text-base font-bold text-foreground">Doğrulama Durumu</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Güvenli bir alışveriş ortamı için kimlik doğrulaması önerilir.
                </p>
              </div>
            </div>

            {!profile.isVerified && profile.verificationStatus !== "pending" && (
              <div className="mb-6 rounded-xl bg-primary/5 p-4 border border-primary/10">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">
                  Doğrulamanın Avantajları
                </h4>
                <ul className="space-y-2">
                  {trust.benefits.list.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs font-medium text-foreground/80"
                    >
                      <CheckCircle2 size={12} className="text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <IdentityVerificationForm userId={user.id} isVerified={profile.isVerified} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationItem({
  label,
  isVerified,
  isPending,
  status,
  profile,
}: {
  label: string;
  isVerified?: boolean;
  isPending?: boolean;
  status?: "none" | "pending" | "approved" | "rejected";
  profile?: Partial<Profile>;
}) {
  // Use centralized logic if profile is provided, otherwise fallback to basic props
  const trustUI = profile ? getSellerTrustUI(profile) : null;

  const isApproved =
    isVerified || status === "approved" || (trustUI?.isApproved && label.includes("İşletme"));
  const pending =
    isPending ||
    status === "pending" ||
    (trustUI?.restrictionState === "restricted_review" && label.includes("İşletme"));
  const isRejected = status === "rejected";

  const theme = isApproved ? "emerald" : pending ? "amber" : isRejected ? "rose" : "slate";
  const styles = {
    emerald: "bg-emerald-50/50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50/50 border-amber-100 text-amber-700",
    rose: "bg-rose-50/50 border-rose-100 text-rose-700",
    slate: "bg-muted/30 border-border/50 text-muted-foreground/50",
  }[theme];

  return (
    <div className={cn("flex flex-col p-3 rounded-lg border transition-all", styles)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <div
          className={cn(
            "size-5 rounded-full border flex items-center justify-center transition-all",
            isApproved ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"
          )}
        >
          {isApproved && <CheckCircle2 size={11} strokeWidth={3} />}
          {pending && <div className="size-1.5 rounded-full bg-amber-500" />}
          {isRejected && <div className="size-1.5 rounded-full bg-rose-500" />}
        </div>
      </div>

      {pending && (
        <p className="mt-2 text-[10px] font-medium leading-tight opacity-80">
          {trust.verificationPendingDesc}
        </p>
      )}
      {(isRejected || (trustUI?.restrictionState === "banned" && label.includes("İşletme"))) && (
        <p className="mt-2 text-[10px] font-bold leading-tight uppercase tracking-tight">
          {trust.verificationRejected}
        </p>
      )}
    </div>
  );
}
