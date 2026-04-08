import { ProfileForm } from "@/components/forms/profile-form";
import { cityOptions } from "@/data";
import { updateProfileAction } from "@/lib/auth/profile-actions";
import { requireUser } from "@/lib/auth/session";
import { CheckCircle2, Circle, User, Phone, MapPin, Mail } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function DashboardProfilePage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    full_name?: string;
    phone?: string;
    city?: string;
    avatar_url?: string;
  };

  const hasFullName = Boolean(metadata.full_name);
  const hasPhone = Boolean(metadata.phone);
  const hasCity = Boolean(metadata.city);
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
      </section>

      <section className="rounded-xl border border-border/60 bg-white p-5">
        <h3 className="text-base font-semibold">Bilgileri Güncelle</h3>

        <div className="mt-4">
          <ProfileForm
            action={updateProfileAction}
            initialValues={{
              fullName: metadata.full_name ?? "",
              phone: metadata.phone ?? "",
              city: metadata.city ?? "",
              avatarUrl: metadata.avatar_url ?? "",
            }}
            cityOptions={cityOptions.map((item) => item.city)}
          />
        </div>
      </section>
    </div>
  );
}
