import { ProfileForm } from "@/components/forms/profile-form";
import { IdentityVerificationForm } from "@/components/forms/identity-verification-form";
import { updateProfileAction } from "@/lib/auth/profile-actions";
import { requireUser } from "@/lib/auth/session";
import { buildProfileFromAuthUser, getStoredProfileById } from "@/services/profile/profile-records";
import { getLiveMarketplaceReferenceData, mergeCityOptions } from "@/services/reference/live-reference-data";
import { CheckCircle2, Circle, User, Phone, MapPin, Mail, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function DashboardProfilePage() {
  const user = await requireUser();
  const profile = (await getStoredProfileById(user.id)) ?? buildProfileFromAuthUser(user);
  const references = await getLiveMarketplaceReferenceData();
  const cityOptions = mergeCityOptions(references.cities, [profile.city]);

  const hasFullName = Boolean(profile.fullName);
  const hasPhone = Boolean(profile.phone);
  const hasCity = Boolean(profile.city);
  const completion = Math.round(
    ([hasFullName, hasPhone, hasCity].filter(Boolean).length / 3) * 100,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/60 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Profil Bilgileri</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              İlanlarınızda görünecek bilgiler
            </p>
          </div>
          <Link 
            href="/dashboard/profile/corporate"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black text-white hover:bg-indigo-700 transition-all uppercase italic tracking-tighter shadow-lg shadow-indigo-200"
          >
            <Building2 size={14} />
            Kurumsal Mağaza Yönetimi
          </Link>
          <div className="text-right">
            <p className="text-2xl font-bold">{completion}%</p>
            <p className="text-xs text-muted-foreground">tamamlandı</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <User className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">Ad Soyad</span>
            </div>
            {hasFullName ? (
              <CheckCircle2 className="size-5 text-emerald-500" />
            ) : (
              <Circle className="size-5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <Phone className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">Telefon</span>
            </div>
            {hasPhone ? (
              <CheckCircle2 className="size-5 text-emerald-500" />
            ) : (
              <Circle className="size-5 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">Şehir</span>
            </div>
            {hasCity ? (
              <CheckCircle2 className="size-5 text-emerald-500" />
            ) : (
              <Circle className="size-5 text-muted-foreground/40" />
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/30 p-3">
          <Mail className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>

        <div className="mt-6">
           <IdentityVerificationForm userId={user.id} isVerified={profile.isVerified} />
        </div>

        <div className="mt-6 rounded-lg border border-border/60 bg-background p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Doğrulama Rozetleri</h3>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-sm font-medium">E-posta Onay</span>
              {profile.emailVerified ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : (
                <Circle className="size-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <span className="text-sm font-medium">Telefon Onay</span>
              {profile.phoneVerified ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : (
                <Circle className="size-5 text-muted-foreground/40" />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-white p-5">
        <h3 className="text-base font-semibold">Bilgileri Güncelle</h3>

        <div className="mt-4">
          <ProfileForm
            action={updateProfileAction}
            initialValues={{
              fullName: profile.fullName,
              phone: profile.phone,
              city: profile.city,
              avatarUrl: profile.avatarUrl ?? "",
            }}
            cityOptions={cityOptions.map((item) => item.city)}
            isPhoneVerified={profile.phoneVerified}
          />
        </div>
      </section>
    </div>
  );
}
