import { ProfileForm } from "@/components/forms/profile-form";
import { IdentityVerificationForm } from "@/components/forms/identity-verification-form";
import { updateProfileAction } from "@/lib/auth/profile-actions";
import { requireUser } from "@/lib/auth/session";
import { buildProfileFromAuthUser, getStoredProfileById } from "@/services/profile/profile-records";
import { getLiveMarketplaceReferenceData, mergeCityOptions } from "@/services/reference/live-reference-data";
import { CheckCircle2, User, Phone, Mail, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
// revalidate kaldırıldı — force-dynamic ile çakışıyor

export default async function DashboardProfilePage() {
  const user = await requireUser();

  // Paralel fetch
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
    ([hasFullName, hasPhone, hasCity].filter(Boolean).length / 3) * 100,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="text-primary" size={16} />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Üyelik Merkezi</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">
            Profil Ayarları
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Hesap bilgilerinizi ve doğrulama durumunuzu yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xl font-black text-foreground">{completion}%</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Profil Tamamlandı</p>
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
              <VerificationItem label="E-posta Onayı" isVerified={profile.emailVerified} />
              <VerificationItem label="Kimlik Doğrulama" isVerified={profile.isVerified} />
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
                <span className="text-sm font-medium text-foreground/90 truncate">{user.email}</span>
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
          {/* Profile Form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Kimlik Bilgileri</h3>
                <p className="text-xs text-muted-foreground font-medium">Bireysel bilgileriniz ilanlarınızda görünür.</p>
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

          {/* Identity Verification */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={18} className="text-primary" />
              <div>
                <h3 className="text-base font-bold text-foreground">Doğrulama Durumu</h3>
                <p className="text-xs text-muted-foreground font-medium">E-posta doğrulaması ilan yayınlamak için zorunludur.</p>
              </div>
            </div>
            <IdentityVerificationForm userId={user.id} isVerified={profile.isVerified} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationItem({ label, isVerified }: { label: string; isVerified: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all",
      isVerified
        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
        : "bg-muted/30 border-border/50 text-muted-foreground/70"
    )}>
      <span className="text-xs font-medium">{label}</span>
      <div className={cn(
        "size-5 rounded-full border flex items-center justify-center transition-all",
        isVerified ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"
      )}>
        {isVerified && <CheckCircle2 size={12} strokeWidth={3} />}
      </div>
    </div>
  );
}
