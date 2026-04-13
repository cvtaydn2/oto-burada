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
    <div className="flex-1 flex items-center justify-center bg-[#FDFDFF] px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group mb-8">
             <div className="size-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 group-hover:scale-105 transition-transform">
                <CarFront size={28} />
             </div>
          </Link>
          <h1 className="text-4xl font-black italic tracking-tightest uppercase text-slate-900 leading-none mb-4">
             {title}
          </h1>
          <p className="text-sm font-bold text-slate-400 italic uppercase tracking-widest">{description}</p>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10">
          <form action={formAction} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">
                   DİJİTAL KİMLİK (E-POSTA)
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  defaultValue={state.fields?.email ?? ""}
                  autoComplete="email"
                  placeholder="isim@mail.com"
                  required
                  className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">
                   GÜVENLİK ANAHTARI
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="size-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tighter">Beni Hatırla</span>
              </label>

              {mode === "login" && (
                <Link
                  href="#"
                  className="text-xs font-black text-primary hover:underline transition-all uppercase tracking-tighter"
                >
                  Şifremi Unuttum
                </Link>
              )}
            </div>

            {state.error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/50 px-6 py-4 text-xs font-bold text-red-500 italic">
                {state.error}
              </div>
            ) : null}

            {state.success ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-4 text-xs font-bold text-emerald-500 italic">
                {state.success}
              </div>
            ) : null}

            <AuthSubmitButton label={submitLabel} />
          </form>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black">
                <span className="bg-white px-4 text-slate-300 uppercase tracking-[0.3em]">VEYA</span>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                className="inline-flex h-14 w-full items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 text-xs font-black text-slate-900 uppercase tracking-widest shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
                Google ile Giriş
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest italic">
          {mode === "login" ? "Henüz üye değil misiniz?" : "Zaten üyeliğiniz var mı?"}{" "}
          <Link
            href={alternateHref}
            className="text-primary hover:underline ml-2 transition-all"
          >
            {alternateLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}