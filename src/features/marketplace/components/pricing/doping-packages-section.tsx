import { Check } from "lucide-react";
import Link from "next/link";

import { formatCurrency } from "@/lib";
import { DOPING_PACKAGES } from "@/lib/doping";

const featuredDopingPackageIds = new Set(["anasayfa_vitrini", "ust_siradayim", "acil_acil"]);

export function DopingPackagesSection() {
  return (
    <section id="doping-paketleri" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Doping Paketleri
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Her doping tek bir ilan için çalışır. Satın aldığınız etki; hangi yüzeyde görünür, ne
            kadar sürer ve nasıl fark yaratır kısmıyla birlikte birebir gösterilir.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {DOPING_PACKAGES.map((pkg) => {
            const isPopular = featuredDopingPackageIds.has(pkg.id);

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl border-2 bg-card p-6 transition-all duration-300 sm:p-8 ${
                  isPopular
                    ? "border-primary shadow-2xl shadow-primary/20"
                    : "border-border hover:border-primary/30 hover:shadow-xl"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">
                    EN ÇOK TERCİH EDİLENLERDEN
                  </div>
                )}

                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-bold text-foreground sm:text-3xl">{pkg.name}</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {pkg.durationDays > 0 ? `${pkg.durationDays} gün` : "Tek kullanım"}
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-primary sm:text-5xl">
                    {formatCurrency(pkg.price)}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pkg.summary}
                  </p>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Nerede görünür?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.surfaces.map((surface) => (
                      <span
                        key={surface}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-foreground"
                      >
                        {surface}
                      </span>
                    ))}
                  </div>
                </div>

                <ul className="mb-8 space-y-3">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard/pricing"
                  className={`inline-flex w-full justify-center rounded-xl py-3 font-semibold transition-all ${
                    isPopular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-2 border-border bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  Panelde Satın Al
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
