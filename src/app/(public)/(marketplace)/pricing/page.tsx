import { ArrowRight, Check, Lock, ShieldCheck, Star, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { WhatsAppSupport } from "@/components/shared/whatsapp-support";
import { CorporatePlansSection } from "@/features/marketplace/components/pricing/corporate-plans-section";
import { DopingPackagesSection } from "@/features/marketplace/components/pricing/doping-packages-section";
import { FreeFeaturesSection } from "@/features/marketplace/components/pricing/free-features-section";
import { ADDITIONAL_FEATURES } from "@/features/marketplace/lib/pricing-data";

export const metadata: Metadata = {
  title: "Fiyatlandırma - OtoBurada Ücretsiz İlan & Doping Paketleri",
  description:
    "OtoBurada ilan verme tamamen ücretsiz. Doping paketleri fiyatı piyasanın 1/10'u. Kurumsal planlar ile profesyonel araç satışları yapın. Şeffaf fiyatlandırma ile en iyi dönüşümü yaşayın.",
};

const TRUST_BADGES = [
  { icon: <Lock size={24} />, text: "256-bit SSL Güvenlik" },
  { icon: <ShieldCheck size={24} />, text: "İlan Moderasyonu" },
  { icon: <Check size={24} />, text: "Plaka & Şasi Kontrolü" },
  { icon: <Truck size={24} />, text: "WhatsApp ile Hızlı İletişim" },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 sm:py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-secondary/20 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star size={16} className="fill-current" />
            <span>Ücretsiz ilan · uygun fiyatlı doping</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Araç Satışınızı{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Hızlandırın
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            İlan verme tamamen <span className="font-semibold text-foreground">ücretsiz</span>.
            İhtiyaç duyduğunuzda uygun fiyatlı doping paketleriyle ilan görünürlüğünüzü artırın.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/listings/create"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
            >
              Ücretsiz İlan Ver
              <ArrowRight size={20} className="ml-2" />
            </Link>

            <Link
              href="#doping-paketleri"
              className="inline-flex items-center justify-center border-2 border-primary bg-background px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/5 transition-colors"
            >
              Doping Paketlerini Keşfet
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-muted/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 text-muted-foreground">
            {TRUST_BADGES.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-sm font-medium">
                <div className="text-primary">{badge.icon}</div>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Features Section */}
      <FreeFeaturesSection />

      {/* Doping Packages Section */}
      <DopingPackagesSection />

      {/* Why purchase doping features */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Neden Doping Almalısınız?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Doping paketleri aracınızı öne çıkarır, görünürlüğü artırır ve satış hızınızı katlar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {ADDITIONAL_FEATURES.map((feature, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Plans Section */}
      <CorporatePlansSection />

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Hazır Mısınız? Araçlarınızı Satmaya Başlayın
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ücretsiz ilan vererek veya doping paketleriyle görünürlüğünüzü artırarak, aracınızı en
            kısa sürede satıcılarla buluşturun.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/listings/create"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
            >
              Ücretsiz İlan Ver
              <ArrowRight size={20} className="ml-2" />
            </Link>

            <Link
              href="#doping-paketleri"
              className="inline-flex items-center justify-center border-2 border-primary bg-background px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/5 transition-colors"
            >
              Doping Paketlerini Gör
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppSupport />
    </div>
  );
}
