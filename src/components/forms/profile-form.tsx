"use client";

import { Camera, MapPin, Mail, UserRound } from "lucide-react";
import { useActionState } from "react";

import type { ProfileActionState } from "@/lib/auth/profile-actions";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

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
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserRound className="size-4 text-primary" />
              Tam Ad
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {values.fullName || "Henüz eklenmedi"}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
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
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              Şehir
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {values.city || "Henüz eklenmedi"}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Camera className="size-4" />
              Avatar
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {values.avatarUrl ? "URL hazır" : "Opsiyonel"}
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
                Temel Profil Bilgileri
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Güven için ad, telefon ve şehir alanlarını eksiksiz doldurun. Bu bilgiler ilan akışlarında destekleyici sinyal olarak kullanılır.
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
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

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

          <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Hazırlık Notu
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Profil güncel olursa ilan detay sayfalarında daha güvenli ve düzenli bir satıcı görünümü elde edilir.
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
