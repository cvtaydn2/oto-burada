import { ProfileForm } from "@/components/forms/profile-form";
import { cityOptions } from "@/data";
import { updateProfileAction } from "@/lib/auth/profile-actions";
import { requireUser } from "@/lib/auth/session";
import { BadgeCheck, MapPin, Phone, UserRound } from "lucide-react";

export default async function DashboardProfilePage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    full_name?: string;
    phone?: string;
    city?: string;
    avatar_url?: string;
  };
  const profileCompletion = Math.round(
    ([metadata.full_name, metadata.phone, metadata.city].filter(Boolean).length / 3) * 100,
  );

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Profil</p>
          <h2 className="text-3xl font-semibold tracking-tight">Profil bilgilerini düzenle</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Ad soyad, telefon ve sehir bilgilerini guncel tut. Avatar alani opsiyoneldir ve
            simdilik URL uzerinden alinir.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BadgeCheck className="size-4" />
            Profil hazirlik durumu
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            %{profileCompletion}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tam ad, telefon ve sehir alanlari ilan guveni icin en kritik bilgiler.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserRound className="size-4 text-primary" />
            Tam ad
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {metadata.full_name || "Henuz eklenmedi"}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Phone className="size-4 text-primary" />
            Telefon
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {metadata.phone || "Henuz eklenmedi"}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Sehir
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {metadata.city || "Henuz eklenmedi"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
        Giris yapilan e-posta: <span className="font-semibold text-foreground">{user.email}</span>
      </div>

      <div className="mt-6">
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
  );
}
