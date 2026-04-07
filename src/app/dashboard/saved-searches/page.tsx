import { Bell, ChevronRight, Search, Trash2 } from "lucide-react";
import Link from "next/link";

export default function DashboardSavedSearchesPage() {
  const savedSearches = [
    { id: 1, title: 'Volkswagen Passat 2020+', filters: 'Otomobil > Volkswagen > Passat • 2020 ve üzeri • Max 1.500.000 TL', newResults: 12 },
    { id: 2, title: 'BMW 3 Serisi M Sport', filters: 'Otomobil > BMW > 3 Serisi • M Sport • Siyah', newResults: 0 },
    { id: 3, title: 'Otomatik Dizel SUV', filters: 'Arazi, SUV & Pickup • Otomatik • Dizel • Max 100.000 km', newResults: 5 },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Kayıtlı Aramalar</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ilgi alanlarina gore arama sonuclari</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Sık yaptığınız aramaları kaydedin, yeni ilanlardan anında haberdar olun. Favori marka ve modelleriniz için size en uygun araclari aninda bildirelim.
        </p>
      </div>

      <div className="grid gap-4">
        {savedSearches.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border/70 bg-background p-12 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Search size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Kayitli arama yok</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              listings sayfasinda arama yapip &quot;Bildirim Ac&quot; butonuna tikladiginda kaydedilir.
            </p>
            <Link
              href="/listings"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ilanlari incele
            </Link>
          </div>
        ) : (
          savedSearches.map((search) => (
          <div
            key={search.id}
            className="group flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-border/70 bg-background p-5 shadow-sm transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search className="size-6" />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-foreground">{search.title}</h3>
                  {search.newResults > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                      {search.newResults} Yeni İlan
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{search.filters}</p>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 sm:flex-none">
                <Bell className="size-4" />
                Bildirimler Acik
              </button>
              <button
                className="flex size-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Sil"
              >
                <Trash2 className="size-5" />
              </button>
              <Link
                href="/listings"
                className="flex size-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                title="Aramaya Git"
              >
<ChevronRight className="size-5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
