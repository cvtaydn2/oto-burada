import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Kayıt Ol</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ücretsiz ilan vermeye başla</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Kayıt formu `Phase 3 / Task 3.1` ile tamamlanacak. Bu sayfa şimdilik navigasyon ve ortak
          public deneyimi doğrulamak için hazır.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Giriş Yap
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </section>
    </main>
  );
}
