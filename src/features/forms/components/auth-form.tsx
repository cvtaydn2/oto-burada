"use client";

import { CarFront } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import type { AuthActionState } from "@/features/auth/lib/actions";
import { AuthAlerts } from "@/features/forms/components/auth/auth-alerts";
import { AuthCinematicPanel } from "@/features/forms/components/auth/auth-cinematic-panel";
import {
  EmailField,
  FullNameField,
  PasswordField,
} from "@/features/forms/components/auth/auth-fields";
import { AuthSecurityBadges } from "@/features/forms/components/auth/auth-security-badges";
import { AuthSubmitButton } from "@/features/forms/components/auth-submit-button";
import { BotProtection } from "@/features/shared/components/bot-protection";

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
  const REDIRECT_FLAG_KEY = "__auth_redirect_pending";

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(REDIRECT_FLAG_KEY);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-1 overflow-hidden bg-background">
      {/* Cinematic Left Panel */}
      <AuthCinematicPanel />

      {/* Auth Content */}
      <section
        aria-label="Kimlik Doğrulama Paneli"
        className="flex w-full items-center justify-center bg-background px-6 py-12 sm:px-10 lg:w-1/2 lg:px-20"
      >
        <div className="w-full max-w-md space-y-8 lg:space-y-10">
          {/* Mobile Header */}
          <div className="text-center lg:hidden space-y-4">
            <Link
              href="/"
              aria-label="OtoBurada Ana Sayfa"
              className="inline-flex items-center gap-3 text-3xl font-bold tracking-tighter text-foreground mx-auto"
            >
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                <CarFront size={22} className="text-white" />
              </div>
              OtoBurada
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
              Güvenli hesap erişimi
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.15rem]">
              {config.title}
            </h1>
            <p className="text-sm font-medium leading-6 text-muted-foreground">
              {config.description}
            </p>
          </div>

          {/* Form Card */}
          <div className="relative rounded-[1.6rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] sm:p-8">
            <form action={formAction} className="space-y-6">
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
                <div className="flex justify-center rounded-2xl border border-dashed border-border/80 bg-muted/25 py-3">
                  <BotProtection onVerify={setTurnstileToken} />
                </div>
              )}

              <AuthAlerts state={state} />

              <AuthSubmitButton label={submitLabel} />
            </form>

            <div className="mt-8 flex flex-col gap-4 border-t border-border/80 pt-8 text-center">
              <Link
                href={alternateHref}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input/90 bg-background px-4 text-sm font-semibold text-foreground transition-all hover:border-primary/15 hover:bg-muted/40"
              >
                {alternateLabel}
              </Link>
            </div>
          </div>

          {/* Security Badges */}
          <AuthSecurityBadges />
        </div>
      </section>
    </div>
  );
}
