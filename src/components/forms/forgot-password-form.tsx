"use client";

import { ChevronLeft, Fingerprint, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AuthSubmitButton } from "@/components/forms/auth-submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthActionState, forgotPasswordAction } from "@/features/auth/lib/actions";

const initialState: AuthActionState = null;

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  const submittedEmail = state?.fields?.email;

  return (
    <div className="min-h-screen grid bg-background lg:grid-cols-2">
      <div className="hidden overflow-hidden bg-slate-950 lg:flex lg:items-center lg:justify-center lg:p-16 xl:p-20">
        <div className="relative z-10 w-full max-w-lg space-y-8 text-white">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/80">
            Hesap kurtarma
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight xl:text-5xl">
              Şifrenizi yenilemek için güvenli bağlantıyı e-posta ile gönderelim.
            </h2>
            <p className="max-w-md text-base leading-7 text-slate-300">
              Hesabınıza tekrar erişebilmeniz için kısa ve güvenli bir sıfırlama akışı sunuyoruz.
              Gönderilen bağlantı üzerinden yeni şifrenizi belirleyebilirsiniz.
            </p>
          </div>
          <div className="space-y-3">
            <PanelBenefit
              title="Kısa akış"
              description="Tek bir e-posta adresiyle şifre yenileme bağlantınızı isteyin."
            />
            <PanelBenefit
              title="Güvenli doğrulama"
              description="Bağlantı yalnızca hesabınızla ilişkili doğrulama adımı üzerinden çalışır."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
        <div className="w-full max-w-md space-y-6 sm:space-y-7">
          <div className="space-y-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft size={16} />
              Girişe dön
            </Link>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Şifre sıfırlama
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.15rem]">
                Şifremi unuttum
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                E-posta adresinizi girin. Size yeni şifre belirlemeniz için güvenli bir bağlantı
                gönderelim.
              </p>
            </div>
          </div>

          {state?.message ? (
            <div className="space-y-4 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-700">{state.message}</p>
                {submittedEmail ? (
                  <p className="text-sm leading-6 text-emerald-700/85">
                    Gönderilen adres: <span className="font-semibold">{submittedEmail}</span>
                  </p>
                ) : null}
                <p className="text-sm leading-6 text-emerald-700/85">
                  E-posta birkaç dakika içinde gelmediyse spam klasörünü kontrol edin.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Girişe dön
                </Link>
                <Link
                  href="/forgot-password"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-background px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100/70"
                >
                  Başka e-posta dene
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-border/70 bg-card p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)] sm:p-6">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Nasıl çalışır?</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  E-posta adresinizi doğruladıktan sonra hesabınıza özel sıfırlama bağlantısı
                  gönderilir.
                </p>
              </div>

              <form action={formAction} className="mt-5 space-y-5 sm:mt-6">
                <Field className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">E-posta adresi</Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      type="email"
                      name="email"
                      defaultValue={state?.fields?.email ?? ""}
                      placeholder="isim@mail.com"
                      className="h-12 w-full rounded-xl border-border/80 bg-background pl-11 pr-4"
                      required
                      autoComplete="email"
                    />
                  </div>
                </Field>

                {state?.error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
                  >
                    {state.error}
                  </div>
                )}

                <AuthSubmitButton
                  label="Sıfırlama bağlantısı gönder"
                  icon={<Fingerprint size={18} />}
                />
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Güvenlik notu</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Şifre sıfırlama bağlantısı kişiye özeldir. Ortak cihazlarda işlem yaptıktan sonra
                  oturumu kapatmanız önerilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelBenefit({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
