"use client";

import Link from "next/link";

import type { AuthActionState } from "@/features/auth/lib/actions";

interface AuthAlertsProps {
  state: AuthActionState;
}

export function AuthAlerts({ state }: AuthAlertsProps) {
  if (!state) return null;

  return (
    <>
      {state.error && (
        <div
          id="auth-error"
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
        >
          {state.error}
        </div>
      )}

      {state.message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-600"
        >
          {state.message}
        </div>
      )}

      {state.reason === "email_not_confirmed" && (
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
    </>
  );
}
