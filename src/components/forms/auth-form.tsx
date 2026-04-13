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
    <div className="flex flex-1 items-center justify-center bg-[#F8FAFC] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group mb-8">
             <div className="flex size-12 items-center justify-center rounded-xl bg-sky-500 text-white transition-transform group-hover:scale-105">
                <CarFront size={24} />
             </div>
          </Link>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
             {title}
          </h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <form action={formAction} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 ml-1 block text-xs font-medium text-slate-600">
                   E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  defaultValue={state.fields?.email ?? ""}
                  autoComplete="email"
                  placeholder="isim@mail.com"
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 ml-1 block text-xs font-medium text-slate-600">
                   Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="size-4 cursor-pointer rounded border-slate-300 text-primary transition-all focus:ring-primary/20"
                />
                <span className="text-xs text-slate-500 transition-colors group-hover:text-slate-900">Beni hatırla</span>
              </label>

              {mode === "login" && (
                <Link
                  href="#"
                  className="text-xs font-medium text-primary transition-all hover:underline"
                >
                  Şifremi Unuttum
                </Link>
              )}
            </div>

            {state.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {state.error}
              </div>
            ) : null}

            {state.success ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                {state.success}
              </div>
            ) : null}

            <AuthSubmitButton label={submitLabel} />
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-medium">
                <span className="bg-white px-3 text-slate-400">veya</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
                Google ile devam et
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? "Henüz üye değil misiniz?" : "Zaten üyeliğiniz var mı?"}{" "}
          <Link
            href={alternateHref}
            className="ml-1 text-primary transition-all hover:underline"
          >
            {alternateLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}