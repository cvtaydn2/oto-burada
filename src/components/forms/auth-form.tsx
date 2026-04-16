"use client";

import Link from "next/link";
import { CarFront, ShieldCheck, BadgeCheck, ArrowRight } from "lucide-react";
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
  next?: string;
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
  next,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen flex-1 overflow-hidden bg-white">
      <section className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-slate-950 px-12 py-14 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.92), rgba(15,23,42,0.72)), url("https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1920&q=80")',
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tight text-sky-400">
            <CarFront size={28} />
            OtoBurada
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl font-black leading-tight tracking-tight">
            Türkiye&apos;nin en güvenilir otomobil pazarına hoş geldiniz.
          </h1>
          <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-slate-200">
            Binlerce güncel ilan, daha temiz karar akışları ve güven odaklı satıcı profilleriyle aradığınız araca daha hızlı ulaşın.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur">
              <ShieldCheck size={16} className="text-sky-300" />
              Kimlik doğrulama odaklı ilanlar
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur">
              <BadgeCheck size={16} className="text-sky-300" />
              Şeffaf ekspertiz görünümü
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs text-slate-400">
          <span>© 2026 OtoBurada</span>
          <Link href="/legal/terms" className="hover:text-white transition-colors">Kullanım Şartları</Link>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">Gizlilik</Link>
        </div>
      </section>

      <section className="flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-tight text-sky-500">
              <CarFront size={28} />
              OtoBurada
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">{description}</p>
          </div>

          <div className="mb-8 flex border-b border-slate-200">
            <Link
              href="/login"
              className={`flex-1 border-b-2 py-3 text-center text-sm font-bold transition-colors ${
                isLogin ? "border-sky-500 text-sky-500" : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className={`flex-1 border-b-2 py-3 text-center text-sm font-bold transition-colors ${
                !isLogin ? "border-sky-500 text-sky-500" : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Kayıt Ol
            </Link>
          </div>

          <form action={formAction} className="space-y-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                name="email"
                defaultValue={state.fields?.email ?? ""}
                autoComplete="email"
                placeholder="E-posta"
                required
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700">
                  Şifre
                </label>
                {isLogin && (
                  <Link href="/forgot-password" className="text-xs font-semibold text-sky-500 hover:text-sky-600">
                    Şifremi Unuttum?
                  </Link>
                )}
              </div>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="Şifre"
                required
                minLength={6}
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            {isLogin && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-sky-500 focus:ring-sky-200"
                />
                <span className="text-sm text-slate-600">Beni Hatırla</span>
              </label>
            )}

            {state.error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                {state.error}
              </div>
            ) : null}

            {state.success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {state.success}
              </div>
            ) : null}

            <AuthSubmitButton label={submitLabel} />
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Veya
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={alternateHref}
                className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                {isLogin ? "Hesap Oluştur" : "Giriş Yap"}
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}
            <Link href={alternateHref} className="ml-1 font-bold text-sky-500 hover:text-sky-600">
              {alternateLabel}
            </Link>
          </p>

          <div className="mt-6 flex justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} />
              SSL Secure
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight size={12} />
              Verified Ads
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
