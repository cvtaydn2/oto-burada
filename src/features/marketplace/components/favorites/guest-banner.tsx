import { LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function GuestBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-card text-blue-500 shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <p className="text-sm font-medium text-foreground/90">
            Favorileri tüm cihazlarda senkronize et
          </p>
        </div>
        <Link
          href="/login"
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/90"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
      <LogIn className="mx-auto mb-3 size-10 text-blue-500" />
      <h3 className="text-lg font-bold text-foreground">Bulut senkronizasyonu</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Favorilerin şu an sadece bu cihazda. Giriş yaparak tüm cihazlardan eriş.
      </p>
      <Link
        href="/login"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
      >
        <LogIn size={15} />
        Giriş Yap
      </Link>
    </div>
  );
}
