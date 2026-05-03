import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "E-posta Doğrulama | OtoBurada",
};

export default async function VerifyEmailPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-card">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full animate-pulse" />
          <div className="relative size-24 rounded-3xl bg-slate-950 flex items-center justify-center text-primary shadow-2xl">
            <Mail size={40} className="animate-bounce" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold italic uppercase tracking-tighter text-foreground leading-tight">
            E-POSTA <span className="text-primary italic">DOĞRULAMA</span>
          </h1>
          <p className="text-lg font-medium text-muted-foreground italic leading-relaxed">
            {user ? (
              <>
                <span className="text-foreground font-bold">{user.email}</span> adresine
                gönderdiğimiz bağlantıya tıklayarak hesabınızı aktifleştirin.
              </>
            ) : (
              "Doğrulama bağlantısını açtığınız oturum bulunamadı. Hesabınıza giriş yaparak yeniden doğrulama isteyebilirsiniz."
            )}
          </p>
        </div>

        <div className="grid gap-4">
          <div className="p-6 rounded-3xl bg-slate-900/5 border border-border/50 text-left space-y-3">
            <div className="flex items-center gap-3 text-foreground font-bold uppercase tracking-widest text-[10px]">
              <ShieldCheck className="text-primary" size={16} />
              NEDEN GEREKLİ?
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              Pazar yerimizin güvenliğini korumak ve sahte ilanların önüne geçmek için tüm
              kullanıcılarımızın e-posta adresini doğrulaması zorunludur.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col gap-4">
          {user && !user.email_confirmed_at ? (
            <ResendVerificationButton email={user.email} />
          ) : null}

          <Link
            href="/login"
            className="h-16 w-full rounded-xl bg-slate-900 text-white flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm shadow-slate-900/20 italic"
          >
            GİRİŞ EKRANINA DÖN
            <ArrowRight size={20} />
          </Link>

          {!user && (
            <Link
              href="/register"
              className="h-14 w-full rounded-xl border border-border bg-background text-foreground flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest transition-all hover:bg-muted"
            >
              YENİ HESAP OLUŞTUR
            </Link>
          )}

          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
            E-posta gelmedi mi? Gereksiz (Spam) kutusunu kontrol etmeyi unutmayın.
          </p>
        </div>
      </div>
    </div>
  );
}
