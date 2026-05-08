"use client";

import { LoaderCircle, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { updatePasswordAction } from "@/features/auth/lib/actions";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";

const initialState = null;

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => router.push("/dashboard"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <div className="min-h-screen grid bg-background lg:grid-cols-2">
      <div className="hidden overflow-hidden bg-slate-950 lg:flex lg:items-center lg:justify-center lg:p-16 xl:p-20">
        <div className="relative z-10 w-full max-w-lg space-y-8 text-white">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/80">
            Yeni şifre belirleme
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight xl:text-5xl">
              Güvenli, güçlü ve kolay hatırlanabilir yeni şifrenizi belirleyin.
            </h2>
            <p className="max-w-md text-base leading-7 text-slate-300">
              Hesabınıza yeniden erişirken güvenliği korumak için kısa ama net bir şifre yenileme
              akışı sunuyoruz.
            </p>
          </div>
          <div className="space-y-3">
            <PanelTip
              title="En az 8 karakter"
              description="Tahmin edilmesi zor ve size özel bir parola kullanmanız önerilir."
            />
            <PanelTip
              title="Tekrar doğrulama"
              description="Yazım hatalarını azaltmak için yeni şifrenizi iki kez girin."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
        <div className="w-full max-w-md space-y-6 sm:space-y-7">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Şifre yenileme
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.15rem]">
              Yeni şifrenizi oluşturun
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Güvenli bir parola belirleyin ve ardından hesabınızı kullanmaya kaldığınız yerden
              devam edin.
            </p>
          </div>

          {state?.success ? (
            <div className="space-y-3 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-5 text-center sm:p-6">
              <ShieldCheck className="mx-auto text-emerald-500" size={36} />
              <p className="text-base font-semibold text-emerald-700">
                Şifreniz başarıyla güncellendi.
              </p>
              <p className="text-sm leading-6 text-emerald-700/85">
                Kısa süre içinde panelinize yönlendiriliyorsunuz.
              </p>
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-border/70 bg-card p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)] sm:p-6">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Şifre önerisi</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Büyük-küçük harf, rakam veya size özel bir kombinasyon kullanarak daha güvenli bir
                  parola oluşturabilirsiniz.
                </p>
              </div>

              <form action={formAction} className="mt-5 space-y-5 sm:mt-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Yeni şifre
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      aria-invalid={!!state?.fieldErrors?.password}
                      className="h-12 w-full rounded-xl border-border/80 bg-background pl-11 pr-4 aria-invalid:border-rose-300"
                    />
                  </div>
                  {state?.fieldErrors?.password && (
                    <p className="text-sm leading-6 text-rose-500">
                      {state.fieldErrors.password[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    Şifre tekrarı
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      id="confirm"
                      name="confirm"
                      type="password"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      aria-invalid={!!state?.fieldErrors?.confirm}
                      className="h-12 w-full rounded-xl border-border/80 bg-background pl-11 pr-4 aria-invalid:border-rose-300"
                    />
                  </div>
                  {state?.fieldErrors?.confirm && (
                    <p className="text-sm leading-6 text-rose-500">
                      {state.fieldErrors.confirm[0]}
                    </p>
                  )}
                </div>

                {state?.error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
                  >
                    {state.error}
                  </div>
                )}

                <SubmitButton />
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Güvenlik ipucu</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Eski şifrenizden farklı, başka platformlarda kullanmadığınız bir parola seçmeniz
                  daha güvenlidir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <span className="inline-flex items-center gap-2">
          Şifreyi güncelle
          <Lock size={16} />
        </span>
      )}
    </Button>
  );
}

function PanelTip({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}
