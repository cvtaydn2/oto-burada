"use client";

import { CarFront } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { AuthAlerts } from "@/components/forms/auth/auth-alerts";
import { AuthCinematicPanel } from "@/components/forms/auth/auth-cinematic-panel";
import { EmailField, FullNameField, PasswordField } from "@/components/forms/auth/auth-fields";
import { AuthSecurityBadges } from "@/components/forms/auth/auth-security-badges";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";
import { BotProtection } from "@/components/shared/bot-protection";
import type { AuthActionState } from "@/features/auth/lib/actions";

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
    title: "Giriş yap",
    description: "Hesabınıza erişmek için e-posta adresiniz ve şifrenizle devam edin.",
    eyebrow: "Güvenli hesap erişimi",
    helperTitle: "Hızlı erişim",
    helperDescription:
      "İlanlarınızı, favorilerinizi ve hesap ayarlarınızı tek yerden yönetmek için oturum açın.",
    passwordHint: "Hesabınızı açmak için mevcut şifrenizi girin.",
    passwordPlaceholder: "Şifrenizi girin",
    passwordAutoComplete: "current-password",
  },
  register: {
    title: "Hesap oluştur",
    description: "Ücretsiz ilan vermek ve araç alım-satım sürecini yönetmek için kayıt olun.",
    eyebrow: "Ücretsiz üyelik",
    helperTitle: "2 dakikada başlayın",
    helperDescription:
      "Temel bilgilerinizi girin, hesabınızı doğrulayın ve ilk ilanınızı hızlıca yayına hazırlayın.",
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
  const REDIRECT_FLAG_KEY = "__auth_redirect_pending";

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(REDIRECT_FLAG_KEY);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-1 overflow-hidden bg-background">
      <AuthCinematicPanel />

      <section
        aria-label="Kimlik doğrulama paneli"
        className="flex w-full items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-10 lg:w-1/2 lg:px-12 lg:py-12 xl:px-16"
      >
        <div className="w-full max-w-md space-y-6 sm:space-y-7">
          <div className="space-y-4 text-center lg:hidden">
            <Link
              href="/"
              aria-label="OtoBurada ana sayfa"
              className="inline-flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/20">
                <CarFront size={22} />
              </div>
              OtoBurada
            </Link>
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {config.eyebrow}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.15rem]">
              {config.title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">{config.description}</p>
          </div>

          <div className="rounded-[1.6rem] border border-border/70 bg-card p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.24)] sm:p-6 lg:p-7">
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{config.helperTitle}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {config.helperDescription}
              </p>
            </div>

            <form action={formAction} className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <input type="hidden" name="turnstile_token" value={turnstileToken || ""} />

              {!isLogin && <FullNameField state={state} />}

              <EmailField state={state} />

              <PasswordField
                state={state}
                isLogin={isLogin}
                passwordHintId={passwordHintId}
                passwordPlaceholder={config.passwordPlaceholder}
                passwordAutoComplete={config.passwordAutoComplete}
                passwordHint={config.passwordHint}
              />

              {!isLogin && (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-3">
                  <BotProtection onVerify={setTurnstileToken} />
                </div>
              )}

              <AuthAlerts state={state} />

              <AuthSubmitButton label={submitLabel} />
            </form>

            <div className="mt-6 border-t border-border/80 pt-6 text-center">
              <Link
                href={alternateHref}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input/90 bg-background px-4 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-muted/40"
              >
                {alternateLabel}
              </Link>
            </div>
          </div>

          <AuthSecurityBadges />
        </div>
      </section>
    </div>
  );
}
