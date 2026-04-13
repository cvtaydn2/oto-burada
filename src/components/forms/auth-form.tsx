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
      <div className="w-full max-w-[420px]">
        <div className="mb-10 text-center">
           <Link href="/" className="inline-flex items-center gap-2.5 group mb-10">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-white transition-transform group-hover:scale-105">
                 <CarFront size={26} />
              </div>
           </Link>
          <h1 className="mb-2 text-3xl font-black text-slate-900">
             {title}
          </h1>
          <p className="text-sm font-medium text-slate-500">{description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <form action={formAction} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 ml-1 block text-xs font-semibold text-slate-600">
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
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 ml-1 block text-xs font-semibold text-slate-600">
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
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-900">Beni hatırla</span>
              </label>

              {mode === "login" && (
                <Link
                  href="#"
                  className="text-xs font-semibold text-primary transition-all hover:underline"
                >
                  Şifremi Unuttum
                </Link>
              )}
            </div>

            {state.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                {state.error}
              </div>
            ) : null}

            {state.success ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
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
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-400">veya</span>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
                Google ile devam et
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#20bd5a] active:scale-[0.98]"
              >
                <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ile devam et
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          {mode === "login" ? "Henüz üye değil misiniz?" : "Zaten üyeliğiniz var mı?"}{" "}
          <Link
            href={alternateHref}
            className="ml-1 font-semibold text-primary transition-all hover:underline"
          >
            {alternateLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}