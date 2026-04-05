import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Giriş</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Hesabına giriş yap</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Supabase tabanlı giriş akışı `Phase 3 / Task 3.1` içinde tamamlanacak. Şimdilik public
          shell ve yönlendirme akışı hazır.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kayıt Ol
          </Link>
          <Link
            href="/listings"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            İlanları İncele
          </Link>
        </div>
      </section>
    </main>
  );
}
