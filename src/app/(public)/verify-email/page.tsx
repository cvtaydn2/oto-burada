import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { ResendVerificationButton } from "@/features/auth/components/resend-verification-button";
import { createSupabaseServerClient } from "@/lib/server";

export const metadata = {
  title: "E-posta Doğrulama | OtoBurada",
};

export default async function VerifyEmailPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="w-full max-w-2xl rounded-[2rem] border border-border/70 bg-card px-5 py-7 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)] sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-xl flex-col items-center space-y-6 sm:space-y-7">
          <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-primary/8 text-primary sm:size-18">
            <Mail className="size-7 sm:size-8" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary">
              E-posta doğrulama
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Hesabınızı aktifleştirmek için e-posta adresinizi doğrulayın.
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {user ? (
                <>
                  <span className="font-semibold text-foreground">{user.email}</span> adresine bir
                  doğrulama bağlantısı gönderdik. Bağlantıya tıklayarak hesabınızı güvenli şekilde
                  kullanmaya başlayabilirsiniz.
                </>
              ) : (
                "Doğrulama bağlantısını açtığınız oturum bulunamadı. Giriş yaparak veya yeniden hesap oluşturarak yeni bir doğrulama e-postası isteyebilirsiniz."
              )}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <InfoCard
              title="Neden gerekli?"
              description="Daha güvenli bir pazar yeri deneyimi için her hesabın e-posta adresini doğrulamasını istiyoruz."
            />
            <InfoCard
              title="E-posta gelmediyse"
              description="Gereksiz veya spam klasörünü kontrol edin. Gerekirse aşağıdaki butonla doğrulama e-postasını tekrar gönderebilirsiniz."
            />
          </div>

          <div className="w-full space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 sm:p-5">
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <ShieldCheck className="size-4.5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Güvenlik notu</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Hesabınızı doğrulamadan ilan yayınlama ve hesap güvenliğiyle ilgili bazı adımlar
                  tam olarak aktif olmayabilir.
                </p>
              </div>
            </div>

            {user && !user.email_confirmed_at ? (
              <div className="pt-1">
                <ResendVerificationButton email={user.email} />
              </div>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
            >
              Giriş ekranına dön
              <ArrowRight className="size-4" />
            </Link>

            {!user && (
              <Link
                href="/register"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border/80 bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
              >
                Yeni hesap oluştur
              </Link>
            )}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Doğrulama e-postasını bulamıyorsanız birkaç dakika bekleyip yeniden deneyin.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 p-4 text-left">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
