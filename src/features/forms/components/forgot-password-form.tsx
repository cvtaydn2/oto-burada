"use client";

import { ChevronLeft, Fingerprint, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { type AuthActionState, forgotPasswordAction } from "@/features/auth/lib/actions";
import { AuthSubmitButton } from "@/features/forms/components/auth-submit-button";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";

const initialState: AuthActionState = null;

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  const submittedEmail = state?.fields?.email;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-card">
      {/* Visual Side */}
      <div className="hidden lg:flex relative bg-slate-950 items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#0060ff20,transparent)]" />
          <div className="absolute w-[800px] h-[800px] bg-primary/5 blur-[150px] -bottom-40 -left-40 rounded-full" />
        </div>
        <div className="relative z-10 w-full max-w-lg space-y-12">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary italic">
              Güvenlik Protokolü
            </span>
          </div>
          <h2 className="text-7xl font-bold italic text-white leading-tight tracking-tightest uppercase">
            HESAP <span className="text-primary tracking-widest block">ERİŞİMİ</span>
          </h2>
          <p className="text-muted-foreground/70 font-medium text-lg leading-relaxed italic border-l-4 border-primary pl-8">
            Şifrenizi mi unuttunuz? E-posta adresinize sıfırlama bağlantısı gönderelim.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 lg:p-24 relative overflow-hidden bg-muted/50">
        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 hover:text-primary transition-colors italic"
            >
              <ChevronLeft size={14} />
              GİRİŞE DÖN
            </Link>
            <h1 className="text-4xl font-bold italic uppercase tracking-tighter text-foreground leading-tight">
              Şifremi <span className="text-primary italic">Unuttum</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground italic">
              E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          {state?.message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-2">
              <p className="text-sm font-bold text-emerald-700">✅ {state.message}</p>
              {submittedEmail ? (
                <p className="text-xs font-semibold text-emerald-700/80">
                  Gönderilen adres: {submittedEmail}
                </p>
              ) : null}
              <p className="text-xs text-emerald-600">
                Spam klasörünü de kontrol etmeyi unutmayın.
              </p>
              <div className="pt-2 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-700"
                >
                  Girişe Dön
                </Link>
                <Link
                  href="/forgot-password"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 px-4 text-xs font-bold uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100"
                >
                  Başka E-posta Dene
                </Link>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              <div className="space-y-2 group">
                <Label
                  htmlFor="forgot-email"
                  className="text-[10px] font-bold px-1 uppercase tracking-widest text-muted-foreground/70 italic group-focus-within:text-primary transition-colors"
                >
                  E-POSTA ADRESİ
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors"
                    size={20}
                  />
                  <Input
                    id="forgot-email"
                    type="email"
                    name="email"
                    defaultValue={state?.fields?.email ?? ""}
                    placeholder="isim@mail.com"
                    className="h-16 w-full pl-14 pr-6 rounded-xl bg-card border-2 border-border/50 shadow-sm shadow-slate-200/40 focus:border-primary outline-none transition-all font-bold italic tracking-tighter text-foreground"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {state?.error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
                >
                  {state.error}
                </div>
              )}

              <AuthSubmitButton
                label="SIFIRLAMA BAĞLANTISI GÖNDER"
                icon={<Fingerprint size={20} />}
              />
            </form>
          )}

          <div className="pt-6 border-t border-border">
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
              <ShieldCheck className="text-primary shrink-0" size={24} />
              <p className="text-[11px] font-bold text-indigo-900/60 leading-relaxed italic">
                Eğer e-posta almazsanız, lütfen spam klasörünü kontrol edin veya 10 dakika sonra
                tekrar deneyin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
