import { Hammer, LogIn, MessageSquare } from "lucide-react";
import Link from "next/link";

export const revalidate = 300;

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 border border-primary/20 mb-4">
          <Hammer className="size-12 text-primary animate-bounce" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Bakım Modundayız
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Sizlere daha iyi bir deneyim sunabilmek için şu an sistemimizi güncelliyoruz.
            Anlayışınız için teşekkür ederiz.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm text-left">
            <MessageSquare className="size-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Destek</h3>
            <p className="text-xs text-muted-foreground">
              Sorularınız için support@otoburada.com adresinden bize ulaşabilirsiniz.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm text-left">
            <LogIn className="size-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Admin Girişi</h3>
            <p className="text-xs text-muted-foreground">
              Yöneticiyseniz buradan giriş yaparak devam edebilirsiniz.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
            >
              Giriş Yap →
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            OtoBurada — Güvenli Araç Pazaryeri
          </p>
        </div>
      </div>
    </div>
  );
}
