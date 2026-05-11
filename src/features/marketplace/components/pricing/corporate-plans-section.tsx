import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";

import { CORPORATE_PLANS } from "../../lib/pricing-data";

export function CorporatePlansSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/20 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Kurumsal Planlar
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Profesyonel galeri sahipleri ve büyük çaplı lot tedarikçiler için özel tasarlanmış
            planlar. Bireysel ilan verme hâlâ ücretsiz, profesyoneller daha yüksek kapasite için
            abonelik tercih eder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CORPORATE_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card border-2 rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-primary shadow-2xl shadow-primary/20"
                  : "border-border hover:border-primary/30 hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
                  EN POPÜLER
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-primary">₺{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.included
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      {feature.included ? (
                        <Check size={14} className="stroke-[3]" />
                      ) : (
                        <X size={14} />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.included ? "text-foreground" : "text-muted-foreground line-through"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard/pricing"
                className={`inline-flex justify-center w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-2 border-border bg-background hover:border-primary hover:text-primary"
                }`}
              >
                Panelde İncele
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard/pricing"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            Kurumsal planları panelde incele
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
