import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { FREE_FEATURES } from "../../lib/pricing-data";

export function FreeFeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ücretsiz İlan Özellikleri
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            OtoBurada araç satmak tamamen ücretsiz. Sadece ihtiyacınız olduğunda doping alarak
            görünürlüğünüzü artırın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FREE_FEATURES.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-card border border-border rounded-2xl p-6 sm:p-8 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 rounded-xl border-2 border-background flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 mt-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard/listings/create"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            Hemen Ücretsiz İlan Ver
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
