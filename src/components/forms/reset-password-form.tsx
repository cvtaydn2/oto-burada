"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, LoaderCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { usePostHog } from "posthog-js/react";

export function ResetPasswordForm() {
  const router = useRouter();
  const posthog = usePostHog();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError("Şifre güncellenemedi. Lütfen tekrar deneyin.");
        posthog?.captureException(updateError);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError("Beklenmedik bir hata oluştu.");
      posthog?.captureException(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

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
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary italic">Güvenlik Güncelleme</span>
          </div>
          <h2 className="text-7xl font-bold italic text-white leading-tight tracking-tightest uppercase">
            YENİ <span className="text-primary tracking-widest block">ŞİFRE</span>
          </h2>
          <p className="text-muted-foreground/70 font-medium text-lg leading-relaxed italic border-l-4 border-primary pl-8">
            Güvenliğiniz bizim önceliğimizdir. Güçlü bir parola belirleyerek hesabınıza tekrar erişin.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 lg:p-24 relative overflow-hidden bg-muted/30/50">
        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold italic uppercase tracking-tighter text-foreground leading-tight">
              Şifreyi <span className="text-primary italic">Yenile</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground italic">
              Yeni parolanızı belirleyin ve güvenle kullanmaya devam edin.
            </p>
          </div>

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-2">
              <ShieldCheck className="mx-auto text-emerald-500" size={40} />
              <p className="font-bold text-emerald-700">Şifreniz başarıyla güncellendi!</p>
              <p className="text-xs text-emerald-600">Panele yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold px-1 uppercase tracking-widest text-muted-foreground/70 italic group-focus-within:text-primary transition-colors">
                  YENİ ŞİFRE
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    className="h-16 w-full pl-14 pr-6 rounded-xl bg-card border-2 border-border/50 shadow-sm shadow-slate-200/40 focus:border-primary outline-none transition-all font-bold italic tracking-tighter text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold px-1 uppercase tracking-widest text-muted-foreground/70 italic group-focus-within:text-primary transition-colors">
                  ŞİFRE TEKRAR
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                    className="h-16 w-full pl-14 pr-6 rounded-xl bg-card border-2 border-border/50 shadow-sm shadow-slate-200/40 focus:border-primary outline-none transition-all font-bold italic tracking-tighter text-foreground"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="h-16 w-full rounded-xl bg-slate-900 text-white flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm shadow-slate-900/20 italic disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : (
                  <>
                    ŞİFREYİ GÜNCELLE
                    <ShieldCheck size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-6 border-t border-border">
            <div className="flex items-start gap-4 p-6 rounded-3xl bg-slate-900/5 border border-border/50 italic">
              <div className="size-8 rounded-xl bg-card flex items-center justify-center text-primary shadow-sm shrink-0">
                <Lock size={16} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-foreground uppercase">Güvenlik İpucu</p>
                <p className="text-[10px] font-medium text-muted-foreground/70 leading-relaxed">
                  En az 8 karakter, bir büyük harf ve bir rakam içeren şifreler her zaman daha güvenlidir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
