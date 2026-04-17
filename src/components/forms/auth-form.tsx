"use client";

import Link from "next/link";
import { CarFront, ShieldCheck, BadgeCheck, ArrowRight, Sparkles, Lock, CreditCard } from "lucide-react";
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
    <div className="flex min-h-screen flex-1 overflow-hidden bg-[#F8FAFC]">
      {/* Cinematic Left Panel */}
      <section className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-slate-950 px-16 py-16 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.6)), url("https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80")',
          }}
        />
        
        {/* Abstract Overlays */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tighter text-white">
            <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <CarFront size={22} className="text-white" />
            </div>
            OtoBurada <span className="text-blue-500 ml-1">Elite</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
              <Sparkles size={12} />
              PREMIUM EXPERIENCE
            </div>
            <h1 className="text-6xl font-black leading-[1.1] tracking-tighter">
              İkinci Elin <span className="text-blue-500 italic">En Temiz</span> Hali.
            </h1>
          </div>
          
          <p className="max-w-md text-lg font-medium leading-relaxed text-slate-400">
            Binlerce güncel ilan, şeffaf ekspertiz verileri ve güven odaklı moderasyon ile hayalinizdeki araca ulaşın.
          </p>

          <div className="flex flex-col gap-4">
            <FeatureItem icon={<ShieldCheck size={18} />} title="Resmi Ekspertiz" desc="Sadece doğrulanmış raporlar yayına alınır" />
            <FeatureItem icon={<BadgeCheck size={18} />} title="Hızlı WhatsApp" desc="Fiyat teklifi ve randevu tek tıkla elinizde" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span>© 2026 OtoBurada</span>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-white transition-colors">Şartlar</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Gizlilik</Link>
          </div>
        </div>
      </section>

      {/* Auth Content */}
      <section className="flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-20 bg-slate-50/30 backdrop-blur-3xl">
        <div className="w-full max-w-sm space-y-10">
          {/* Mobile Header */}
          <div className="text-center lg:hidden space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 text-3xl font-black tracking-tighter text-slate-900 mx-auto">
              <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <CarFront size={22} className="text-white" />
              </div>
              OtoBurada
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">{title}</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{description}</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
             
             <form action={formAction} className="space-y-6">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  defaultValue={state.fields?.email ?? ""}
                  autoComplete="email"
                  placeholder="isim@example.com"
                  required
                  className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 text-sm font-black text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Güvenli Şifre
                  </label>
                  {isLogin && (
                    <Link href="/forgot-password" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                      Unuttum?
                    </Link>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 text-sm font-black text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {isLogin && (
                <label className="flex items-center gap-3 cursor-pointer group px-1">
                  <div className="relative flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="size-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-100"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-widest">Beni Hatırla</span>
                </label>
              )}

              {state.error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-xs font-black text-rose-600 uppercase tracking-widest leading-relaxed"
                >
                  <Sparkles size={14} className="inline mr-2 mb-0.5" />
                  {state.error}
                </div>
              )}

              {state.success && (
                <div
                  role="status"
                  className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-xs font-black text-emerald-700 uppercase tracking-widest leading-relaxed"
                >
                  <BadgeCheck size={14} className="inline mr-2 mb-0.5" />
                  {state.success}
                </div>
              )}

              <AuthSubmitButton label={isLogin ? "GİRİŞ YAP" : "KAYIT OL"} />
            </form>

            <div className="mt-10 pt-10 border-t border-slate-50 flex flex-col gap-4 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Veya Diğer Seçenekler</p>
                <Link
                  href={alternateHref}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-100 bg-white px-4 text-xs font-black text-slate-900 uppercase tracking-widest transition-all hover:bg-slate-50 shadow-sm"
                >
                  {isLogin ? "Hesap Oluştur" : "Zaten üyeniz mi var?"}
                </Link>
            </div>
          </div>

          <div className="flex justify-center gap-10">
             <SecurityBadge icon={<Lock size={14} />} label="AES-256 SECURE" />
             <SecurityBadge icon={<CreditCard size={14} />} label="PCI-DSS COMPLIANT" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
      <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function SecurityBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 tracking-[0.2em]">
       <div className="text-slate-400">
         {icon}
       </div>
       {label}
    </div>
  );
}
