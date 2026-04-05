import { DashboardPlaceholder } from "@/components/shared/dashboard-placeholder";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam ilan</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">0</p>
        </div>
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Favori ilan</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">0</p>
        </div>
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Profil durumu</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">Hazır</p>
        </div>
      </section>

      <DashboardPlaceholder
        eyebrow="Genel Bakış"
        title="Panel iskeleti hazır"
        description="Bu alan artık korumalı dashboard shell içinde çalışıyor. Sıradaki görevlerde profil, favoriler ve ilanlarım ekranları gerçek içerikle doldurulacak."
      />
    </div>
  );
}
