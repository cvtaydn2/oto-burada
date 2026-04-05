export default function ListingsPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
          Hazır altyapı
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">İlanlar sayfası için temel rota hazır</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Bu sayfa Faz 2, Görev 2.3 kapsamında gerçek filtreleme ve sonuç görünümü ile
          doldurulacak. Şimdilik App Router yapısı ve temel tasarım sistemi doğrulanmış durumda.
        </p>
      </section>
    </main>
  );
}
