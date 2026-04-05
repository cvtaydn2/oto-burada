import { ProfileForm } from "@/components/forms/profile-form";
import { cityOptions } from "@/data";
import { updateProfileAction } from "@/lib/auth/profile-actions";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardProfilePage() {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    full_name?: string;
    phone?: string;
    city?: string;
    avatar_url?: string;
  };

  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Profil</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">Profil bilgilerini düzenle</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Ad soyad, telefon ve şehir bilgilerini güncel tut. Avatar alanı opsiyoneldir ve şimdilik
        URL üzerinden alınır.
      </p>

      <div className="mt-6 rounded-[1.5rem] bg-muted/35 p-4 text-sm text-muted-foreground">
        Giriş yapılan e-posta: <span className="font-semibold text-foreground">{user.email}</span>
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
