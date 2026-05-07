"use client";

import { BadgeCheck, CarFront, CreditCard, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { AuthSubmitButton } from "@/components/forms/auth-submit-button";
import { BotProtection } from "@/components/shared/bot-protection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/lib/auth/actions";

interface AuthFormProps {
  action: (state: AuthActionState | undefined, formData: FormData) => Promise<AuthActionState>;
  title: string;
  description: string;
  submitLabel: string;
  alternateHref: string;
  alternateLabel: string;
  mode: "login" | "register";
  next?: string;
}

const initialState: AuthActionState = null;

const AUTH_MODE_CONFIG = {
  login: {
    title: "Giriş Yap",
    description: "Hesabınıza erişmek için e-posta adresinizi girin.",
    passwordHint: "Hesabınızı açmak için mevcut şifrenizi girin.",
    passwordPlaceholder: "Şifrenizi girin",
    passwordAutoComplete: "current-password",
  },
  register: {
    title: "Hesap Oluştur",
    description: "Ücretsiz ilan vermek için hemen kayıt olun.",
    passwordHint: "Güvenli bir şifre seçin. En az 8 karakter kullanın.",
    passwordPlaceholder: "En az 8 karakter",
    passwordAutoComplete: "new-password",
  },
} as const;

export function AuthForm({
  action,
  mode,
  next,
  alternateHref,
  alternateLabel,
  submitLabel,
}: Omit<AuthFormProps, "title" | "description">) {
  const [state, formAction] = useActionState(action, initialState);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const config = AUTH_MODE_CONFIG[mode];
  const isLogin = mode === "login";
  const passwordHintId = `${mode}-password-hint`;
  const fullNameHintId = "register-full-name-hint";
  const REDIRECT_FLAG_KEY = "__auth_redirect_pending";

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(REDIRECT_FLAG_KEY);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-1 overflow-hidden bg-[#F8FAFC]">
      {/* Cinematic Left Panel */}
      <section className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-slate-950 px-16 py-16 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.6)), url("/images/hero_bg.png")',
          }}
        />

        {/* Abstract Overlays */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-2xl font-bold tracking-tighter text-white"
          >
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <CarFront size={22} className="text-white" />
            </div>
            OtoBurada
          </Link>
        </div>

        <div className="relative z-10 max-w-xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
              GÜVENLİ PAZARYERİ
            </div>
            <h1 className="text-5xl font-bold leading-[1.2] tracking-tight">
              İkinci Elin <span className="text-primary">En Temiz</span> Hali.
            </h1>
          </div>

          <p className="max-w-md text-lg font-medium leading-relaxed text-slate-400">
            Binlerce güncel ilan, şeffaf ekspertiz verileri ve güven odaklı moderasyon ile
            hayalinizdeki araca ulaşın.
          </p>

          <div className="flex flex-col gap-3">
            <FeatureItem
              icon={<ShieldCheck size={18} />}
              title="Resmi Ekspertiz"
              desc="Sadece doğrulanmış raporlar yayına alınır"
            />
            <FeatureItem
              icon={<BadgeCheck size={18} />}
              title="Hızlı WhatsApp"
              desc="Fiyat teklifi ve randevu tek tıkla elinizde"
            />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[10px] font-medium uppercase tracking-widest text-slate-500">
          <span>© 2026 OtoBurada</span>
        </div>
      </section>

      {/* Auth Content */}
      <section className="flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-20 bg-background">
        <div className="w-full max-w-sm space-y-10">
          {/* Mobile Header */}
          <div className="text-center lg:hidden space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-3xl font-bold tracking-tighter text-foreground mx-auto"
            >
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                <CarFront size={22} className="text-white" />
              </div>
              OtoBurada
            </Link>
          </div>

          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{config.title}</h1>
            <p className="text-sm font-medium text-muted-foreground">{config.description}</p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm relative">
            <form action={formAction} className="space-y-6">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <input type="hidden" name="turnstile_token" value={turnstileToken || ""} />

              <div className="space-y-2">
                {!isLogin && (
                  <>
                    <Label
                      htmlFor="fullName"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Ad Soyad
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      name="fullName"
                      defaultValue={state?.fields?.fullName ?? ""}
                      autoComplete="name"
                      placeholder="Ad Soyad"
                      required
                      minLength={3}
                      aria-invalid={!!state?.fieldErrors?.fullName}
                      aria-describedby={`${fullNameHintId} ${state?.fieldErrors?.fullName ? "fullName-error" : ""}`}
                      className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
                    />
                    <p
                      id={fullNameHintId}
                      className="px-1 text-[11px] font-medium text-muted-foreground"
                    >
                      İlan ve hesap işlemlerinde görünecek ad soyadınızı yazın.
                    </p>
                    {state?.fieldErrors?.fullName && (
                      <p
                        id="fullName-error"
                        role="alert"
                        className="px-1 text-[11px] font-medium text-destructive"
                      >
                        {state.fieldErrors.fullName[0]}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground ml-1">
                  E-posta Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  defaultValue={state?.fields?.email ?? ""}
                  autoComplete="email"
                  placeholder="isim@example.com"
                  required
                  aria-invalid={!!state?.fieldErrors?.email || !!state?.error}
                  aria-describedby={`${state?.fieldErrors?.email ? "email-error" : ""} ${state?.error ? "auth-error" : ""}`}
                  className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
                />
                {state?.fieldErrors?.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="px-1 text-[11px] font-medium text-destructive"
                  >
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    Şifre
                  </Label>
                  {isLogin && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Unuttum?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={config.passwordAutoComplete}
                  placeholder={config.passwordPlaceholder}
                  required
                  minLength={8}
                  aria-invalid={!!state?.fieldErrors?.password || !!state?.error}
                  aria-describedby={`${passwordHintId} ${state?.fieldErrors?.password ? "password-error" : ""} ${state?.error ? "auth-error" : ""}`}
                  className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
                />
                <p
                  id={passwordHintId}
                  className="px-1 text-[11px] font-medium text-muted-foreground"
                >
                  {config.passwordHint}
                </p>
                {state?.fieldErrors?.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="px-1 text-[11px] font-medium text-destructive"
                  >
                    {state.fieldErrors.password[0]}
                  </p>
                )}

                {isLogin && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      className="rounded border-input bg-muted/30 text-primary focus:ring-primary cursor-pointer"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                    >
                      Beni Hatırla
                    </Label>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-semibold text-foreground"
                    >
                      Şifre Tekrar
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Şifrenizi tekrar girin"
                      required
                      minLength={8}
                      aria-invalid={!!state?.fieldErrors?.confirmPassword}
                      aria-describedby={
                        state?.fieldErrors?.confirmPassword ? "confirm-password-error" : ""
                      }
                      className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
                    />
                    {state?.fieldErrors?.confirmPassword && (
                      <p
                        id="confirm-password-error"
                        role="alert"
                        className="px-1 text-[11px] font-medium text-destructive"
                      >
                        {state.fieldErrors.confirmPassword[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="flex justify-center py-2">
                  <BotProtection onVerify={setTurnstileToken} />
                </div>
              )}

              {state?.error && (
                <div
                  id="auth-error"
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
                >
                  {state?.error}
                </div>
              )}

              {state?.message && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-600"
                >
                  {state.message}
                </div>
              )}

              {state?.reason === "email_not_confirmed" && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                  <p className="font-medium">
                    Hesabın doğrulanmadan ilan verme ve panel işlemleri açılamaz.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/verify-email"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      Doğrulama ekranına git
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      Farklı e-posta ile kayıt ol
                    </Link>
                  </div>
                </div>
              )}

              <AuthSubmitButton label={submitLabel} />
            </form>

            <div className="mt-8 pt-8 border-t border-border flex flex-col gap-4 text-center">
              <Link
                href={alternateHref}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-all hover:bg-muted"
              >
                {alternateLabel}
              </Link>
            </div>
          </div>

          <div className="flex justify-center gap-8">
            <SecurityBadge icon={<Lock size={12} />} label="AES-256 GÜVENLİ" />
            <SecurityBadge icon={<CreditCard size={12} />} label="PCI-DSS UYUMLU" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
      <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function SecurityBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/30 tracking-widest">
      <div className="text-muted-foreground/20">{icon}</div>
      {label}
    </div>
  );
}
