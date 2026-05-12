import { BadgeCheck, Calculator, CarFront, Info, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { ValuationForm } from "@/features/marketplace/components/valuation-form";
import { buildAbsoluteUrl } from "@/features/seo/lib";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";

export const metadata: Metadata = {
  title: "Aracım Ne Kadar? | Ücretsiz Araç Değerleme",
  description:
    "Arabanızın güncel piyasa değerini saniyeler içinde öğrenin. Gerçek ilan verilerine dayalı, yapay zeka destekli fiyat tahmini.",
  alternates: {
    canonical: buildAbsoluteUrl("/aracim-ne-kadar"),
  },
};

export default async function AracimNeKadarPage() {
  const references = await getLiveMarketplaceReferenceData();

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-slate-900 pt-20 pb-24 text-white">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_20%_30%,#4f46e5_0,transparent_50%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-primary-foreground mb-4">
            <Calculator size={14} />
            Yapay Zeka Destekli Değerleme
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter italic uppercase leading-none">
            Aracım <span className="text-primary">Ne Kadar?</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground/70 font-medium italic">
            Piyasadaki binlerce aktif ilanı ve geçmiş verileri analiz ederek aracınızın güncel
            değerini anında hesaplayın.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto -mt-12 max-w-5xl px-4">
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Main Form Area */}
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-sm shadow-slate-200 border border-border">
            <div className="flex items-center gap-4 mb-8">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <CarFront size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold italic tracking-tight">Araç Bilgilerini Girin</h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Lütfen aracınızın temel özelliklerini seçin.
                </p>
              </div>
            </div>

            <ValuationForm brands={references.brands} />
          </div>

          {/* Sidebar / Trust Info */}
          <aside className="space-y-6">
            <div className="p-6 rounded-3xl bg-indigo-600 text-white space-y-4 shadow-sm shadow-indigo-200">
              <TrendingUp size={32} className="opacity-80" />
              <h3 className="text-lg font-bold italic uppercase leading-tight">
                Neden OtoBurada Değerleme?
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm font-medium leading-relaxed">
                  <BadgeCheck size={18} className="shrink-0" />
                  Yapay zeka modellerimiz her gün binlerce yeni ilanla eğitilir.
                </li>
                <li className="flex gap-3 text-sm font-medium leading-relaxed">
                  <BadgeCheck size={18} className="shrink-0" />
                  Sadece plaka veya beyana değil, gerçek pazar verisine dayanır.
                </li>
                <li className="flex gap-3 text-sm font-medium leading-relaxed">
                  <BadgeCheck size={18} className="shrink-0" />
                  Tamamen ücretsiz ve anonimdir.
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Info size={18} />
                <span className="text-sm font-bold italic uppercase">Biliyor musunuz?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium capitalize">
                Doğru fiyatlandırılmış bir araç, piyasa ortalamasına göre 3 kat daha hızlı satılır.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
