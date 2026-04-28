import { ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";

import { DopingStore } from "@/components/dashboard/doping-store";
import { PlanSelector } from "@/components/dashboard/plan-selector";
import { requireUser } from "@/lib/auth/session";
import { getPublicPricingPlans } from "@/services/admin/plans";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import type { Listing } from "@/types";

export const metadata: Metadata = {
  title: "Paketler & Üyelik Planları | Oto Burada",
  description:
    "İlanlarınızı öne çıkarmak için doping alın veya kurumsal üyelik planlarına göz atın.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await requireUser();

  const [plans, { listings }] = await Promise.all([
    getPublicPricingPlans(),
    getStoredUserListings(user.id),
  ]);

  const approvedListings = (listings as Listing[]).filter((l) => l.status === "approved");

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Üyelik Planları */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                Garantili
              </span>
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                Üyelik Planları
              </h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium max-w-xl">
              Bireysel kullanıcılar için ilan vermek her zaman ücretsizdir. Profesyonel satıcılar
              daha yüksek kapasite için plan seçebilir.
            </p>
          </div>
        </div>

        <PlanSelector plans={plans} />
      </section>

      <hr className="border-border/50" />

      {/* 2. Doping Paketleri */}
      <section className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
              <Zap size={20} className="text-amber-500 fill-amber-500/30" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Doping Paketleri</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            İlanlarınızın daha hızlı satılması için öne çıkarma özelliklerini kullanın.
            <span className="text-primary ml-1">Piyasanın 1/10 fiyatına!</span>
          </p>
        </div>

        {approvedListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-16 text-center shadow-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-background border border-border mb-6">
              <Zap size={32} className="text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Yayındaki ilan bulunamadı</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Doping satın alabilmek için en az bir onaylı ilanın olması gerekiyor. Hemen yeni bir
              ilan oluşturun!
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {approvedListings.map((listing) => (
              <div
                key={listing.id}
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                      İLANINIZI ÖNE ÇIKARIN
                    </p>
                    <h3 className="text-xl font-black text-foreground truncate">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <span>
                        {listing.brand} {listing.model}
                      </span>
                      <span>•</span>
                      <span>{listing.year}</span>
                      <span>•</span>
                      <span className="text-foreground font-bold">
                        {listing.price.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-muted-foreground">GÜVENLİ ÖDEME</span>
                  </div>
                </div>
                <DopingStore listingId={listing.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
