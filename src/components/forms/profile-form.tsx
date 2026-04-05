"use client";

import { Camera, MapPin, Phone, UserRound } from "lucide-react";
import { useActionState } from "react";

import type { ProfileActionState } from "@/lib/auth/profile-actions";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";

interface ProfileFormProps {
  action: (
    state: ProfileActionState | undefined,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  initialValues: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl: string;
  };
  cityOptions: string[];
}

const initialState: ProfileActionState = {};

export function ProfileForm({
  action,
  initialValues,
  cityOptions,
}: ProfileFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const values = {
    fullName: state.fields?.fullName ?? initialValues.fullName,
    phone: state.fields?.phone ?? initialValues.phone,
    city: state.fields?.city ?? initialValues.city,
    avatarUrl: state.fields?.avatarUrl ?? initialValues.avatarUrl,
  };

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserRound className="size-4 text-primary" />
            Tam ad
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {values.fullName || "Henuz eklenmedi"}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Phone className="size-4 text-primary" />
            Telefon
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {values.phone || "Henuz eklenmedi"}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Sehir
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {values.city || "Henuz eklenmedi"}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Camera className="size-4" />
            Avatar
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {values.avatarUrl ? "URL hazir" : "Opsiyonel"}
          </p>
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Temel profil bilgileri
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Guven hissi icin ad, telefon ve sehir alanlarini net tut. Bu bilgiler ilan
              akislarinda destekleyici sinyal olarak kullanilir.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
            <span>Ad Soyad</span>
            <input
              type="text"
              name="fullName"
              defaultValue={values.fullName}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Telefon</span>
            <input
              type="tel"
              name="phone"
              defaultValue={values.phone}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Şehir</span>
            <select
              name="city"
              defaultValue={values.city}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Şehir seç</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Camera className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Avatar ve son kayit
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Avatar alani opsiyoneldir. Su an URL ile calisir; dilersen bos birakabilirsin.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>Avatar URL (opsiyonel)</span>
            <input
              type="url"
              name="avatarUrl"
              defaultValue={values.avatarUrl}
              placeholder="https://..."
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Hazirlik notu
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Profil guncel olursa ilan detay sayfalarinda daha guvenli ve duzenli bir satici
              gorunumu elde edilir.
            </p>
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {state.success}
        </p>
      ) : null}

      <AuthSubmitButton label="Profili Güncelle" />
    </form>
  );
}
