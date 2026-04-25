"use client";

import { BadgeCheck, CarFront, CreditCard, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AuthSubmitButton } from "@/components/forms/auth-submit-button";
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
  const config = AUTH_MODE_CONFIG[mode];
  const isLogin = mode === "login";
  const passwordHintId = `${mode}-password-hint`;
  const fullNameHintId = "register-full-name-hint";

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

              <div className="space-y-2">
                {!isLogin && (
                  <>
                    <label
                      htmlFor="fullName"
                      className="text-xs font-medium text-muted-foreground ml-1"
                    >
                      Ad Soyad
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      defaultValue={state?.fields?.fullName ?? ""}
                      autoComplete="name"
                      placeholder="Ad Soyad"
                      required
                      minLength={3}
                      title="Ad soyad alanı en az 3 karakter olmalıdır."
                      aria-describedby={fullNameHintId}
                      className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <p
                      id={fullNameHintId}
                      className="px-1 text-[11px] font-medium text-muted-foreground"
                    >
                      İlan ve hesap işlemlerinde görünecek ad soyadınızı yazın.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium text-muted-foreground ml-1">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  defaultValue={state?.fields?.email ?? ""}
                  autoComplete="email"
                  placeholder="isim@example.com"
                  required
                  aria-invalid={state?.error ? "true" : undefined}
                  aria-describedby={state?.error ? "auth-error" : undefined}
                  className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    Şifre
                  </label>
                  {isLogin && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Unuttum?
                    </Link>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={config.passwordAutoComplete}
                  placeholder={config.passwordPlaceholder}
                  required
                  minLength={8}
                  title={
                    isLogin
                      ? "Lütfen hesabınıza ait şifreyi girin."
                      : "Şifreniz en az 8 karakter olmalıdır."
                  }
                  aria-invalid={state?.error ? "true" : undefined}
                  aria-describedby={`${passwordHintId} ${state?.error ? "auth-error" : ""}`}
                  className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <p
                  id={passwordHintId}
                  className="px-1 text-[11px] font-medium text-muted-foreground"
                >
                  {config.passwordHint}
                </p>
              </div>

              {isLogin && (
                <label className="flex items-center gap-3 cursor-pointer group px-1 min-h-[44px]">
                  <div className="relative flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="size-4 rounded border-input text-primary focus:ring-primary/20"
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Beni Hatırla
                  </span>
                </label>
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
