"use client";

import Link from "next/link";
import { CarFront } from "lucide-react";
import { useActionState } from "react";

import type { AuthActionState } from "@/lib/auth/actions";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";

interface AuthFormProps {
  action: (
    state: AuthActionState | undefined,
    formData: FormData,
  ) => Promise<AuthActionState>;
  title: string;
  description: string;
  submitLabel: string;
  alternateHref: string;
  alternateLabel: string;
  mode: "login" | "register";
}

const initialState: AuthActionState = {};

export function AuthForm({
  action,
  title,
  description,
  submitLabel,
  alternateHref,
  alternateLabel,
  mode,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50/50 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border/60 bg-background p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <CarFront className="size-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {description}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Veya{" "}
            <Link
              href={alternateHref}
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {alternateLabel.toLowerCase()}
            </Link>
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>E-posta adresi</span>
              <input
                type="email"
                name="email"
                defaultValue={state.fields?.email ?? ""}
                autoComplete="email"
                placeholder="ornek@email.com"
                required
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>Şifre</span>
              <input
                type="password"
                name="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-all focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="size-4 rounded border-input text-primary transition-colors focus:ring-primary"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm font-medium text-muted-foreground"
              >
                Beni hatırla
              </label>
            </div>

            {mode === "login" && (
              <div className="text-sm">
                <Link
                  href="#"
                  className="font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Şifrenizi mi unuttunuz?
                </Link>
              </div>
            )}
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p
              aria-live="polite"
              className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
            >
              {state.success}
            </p>
          ) : null}

          <div className="pt-2">
            <AuthSubmitButton label={submitLabel} />
          </div>
        </form>

        {mode === "login" && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 font-medium text-muted-foreground">
                  Veya şununla devam edin
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
              >
                <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Google ile Giriş Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

