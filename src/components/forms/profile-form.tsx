"use client";

import { Camera, Mail, MapPin, UserRound } from "lucide-react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { useState } from "react";

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";
import { Label } from "@/components/ui/label";
import type { ProfileActionState } from "@/lib/auth/profile-actions";

interface ProfileFormProps {
  action: (
    state: ProfileActionState | undefined,
    formData: FormData
  ) => Promise<ProfileActionState>;
  initialValues: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl: string;
  };
  cityOptions: string[];
  isEmailVerified?: boolean;
}

const initialState: ProfileActionState = {};

export function ProfileForm({
  action,
  initialValues,
  cityOptions,
  isEmailVerified = false,
}: ProfileFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isVerifiedLocally, setIsVerifiedLocally] = useState(isEmailVerified);

  const values = {
    fullName: state.fields?.fullName ?? initialValues.fullName,
    phone: state.fields?.phone ?? initialValues.phone,
    city: state.fields?.city ?? initialValues.city,
    avatarUrl: state.fields?.avatarUrl ?? initialValues.avatarUrl,
  };

  return (
    <>
      <form action={formAction} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserRound className="size-4 text-primary" />
              Tam Ad
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {values.fullName || "Henüz eklenmedi"}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="size-4 text-primary" />
                E-posta
              </div>
              {isVerifiedLocally ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : (
                <AlertCircle className="size-4 text-amber-500" />
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {isVerifiedLocally ? "Doğrulandı" : "Doğrulanmadı"}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              Şehir
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {values.city || "Henüz eklenmedi"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Camera className="size-3" />
              Avatar
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {values.avatarUrl ? "URL hazır" : "Opsiyonel"}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <UserRound className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Temel Profil Bilgileri
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Güven için ad, telefon ve şehir alanlarını eksiksiz doldurun. Bu bilgiler ilan
                akışlarında destekleyici sinyal olarak kullanılır.
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

            <div className="space-y-2 text-sm font-medium text-foreground">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone">Telefon</Label>
                {!isVerifiedLocally && (
                  <button
                    type="button"
                    onClick={() => setIsVerifyDialogOpen(true)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    E-posta Doğrula
                  </button>
                )}
              </div>
              <input
                id="phone"
                type="tel"
                name="phone"
                defaultValue={values.phone}
                required
                aria-invalid={!!state.error}
                aria-describedby={state.error ? "profile-error" : undefined}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary aria-invalid:border-destructive"
              />
            </div>

            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>Şehir</span>
              <select
                name="city"
                defaultValue={values.city}
                required
                aria-invalid={!!state.error}
                aria-describedby={state.error ? "profile-error" : undefined}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary aria-invalid:border-destructive"
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

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Camera className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Avatar ve Son Kayıt
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Avatar alanı opsiyoneldir. Şu an URL ile çalışır; dilersen boş bırakabilirsin.
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

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Hazırlık Notu
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                Profil güncel olursa ilan detay sayfalarında daha güvenli ve düzenli bir satıcı
                görünümü elde edilir.
              </p>
            </div>
          </div>
        </section>

        {state.error ? (
          <p
            id="profile-error"
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive font-bold"
          >
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p
            role="status"
            className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary font-bold"
          >
            {state.success}
          </p>
        ) : null}

        <AuthSubmitButton label="Profili Güncelle" />
      </form>

      <EmailVerificationDialog
        isOpen={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onSuccess={() => {
          setIsVerifiedLocally(true);
          setIsVerifyDialogOpen(false);
        }}
      />
    </>
  );
}
