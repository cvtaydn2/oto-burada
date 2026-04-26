import {
  ArrowRight,
  CarFront,
  Check,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { WhatsAppSupport } from "@/components/shared/whatsapp-support";

export const metadata: Metadata = {
  title: "Fiyatlandırma - OtoBurada Ücretsiz İlan & Doping Paketleri",
  description:
    "OtoBurada ilan verme tamamen ücretsiz. Doping paketleri fiyatı piyasanın 1/10\'u. Kurumsal planlar ile profesyonel araç satışları yapın. Şeffaf fiyatlandırma ile en iyi dönüşümü yaşayın.",
};

// Mock data for free listing features
const freeFeatures = [
  {
    icon: <CarFront size={24} />,
    title: "Sınırsız Ücretsiz İlan",
    desc: "Araç türünde sınırsız ücretsiz ilan hakkı",
  },
  {
    icon: <Check size={24} />,
    title: "Moderasyondan Geçer",
    desc: "Güvenlik için tüm ilanlar kontrol edilir",
  },
  {
    icon: <MessageCircle size={24} />,
    title: "Doğrudan WhatsApp",
    desc: "Satıcılarla anında iletişime geçin",
  },
  { icon: <Star size={24} />, title: "Temel Galeri", desc: "İlana en fazla 20 fotoğraf ekleyin" },
  {
    icon: <MapPin size={24} />,
    title: "Konum Belirtme",
    desc: "Şehir ve ilçe bilgisi ile bulunabilirlik",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Rapor Kontrolü",
    desc: "Ekspertiz ve trafik sigortası raporu takibi",
  },
];

// Mock data for doping packages
const dopingPackages = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    originalPrice: 490,
    period: "ay",
    popular: false,
    features: [
      { text: "1 Aktif İlan Limiti", included: true },
      { text: "Vitrinde 7 Gün", included: true },
      { text: "Arama Sonuçlarında Üst Sıra", included: true },
      { text: "Anında Mesaj Gönderme", included: false },
      { text: "Öne Çıkan Galeri", included: false },
      { text: "WhatsApp Direkt Bağlantı", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    originalPrice: 1490,
    period: "ay",
    popular: true,
    features: [
      { text: "3 Aktif İlan Limiti", included: true },
      { text: "Vitrinde 14 Gün", included: true },
      { text: "Arama Sonuçlarında Üst Sıra", included: true },
      { text: "Anında Mesaj Gönderme", included: true },
      { text: "Öne Çıkan Galeri", included: true },
      { text: "WhatsApp Direkt Bağlantı", included: true },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 399,
    originalPrice: 3990,
    period: "ay",
    popular: false,
    features: [
      { text: "10 Aktif İlan Limiti", included: true },
      { text: "Vitrinde 30 Gün", included: true },
      { text: "Arama Sonuçlarında VIP Sıra", included: true },
      { text: "Anında Mesaj Gönderme", included: true },
      { text: "Öne Çıkan Galeri", included: true },
      { text: "WhatsApp Direkt Bağlantı", included: true },
    ],
  },
];

// Mock data for corporate plans
const corporatePlans = [
  {
    name: "Küçük Galeri",
    price: 1499,
    period: "ay",
    icon: <Users size={32} />,
    features: [
      { text: "10 Aktif Araç İlanı", included: true },
      { text: "Temel Galeri Görünümü", included: true },
      { text: "WhatsApp Desteği", included: true },
      { text: "Aylık Performans Raporu", included: true },
      { text: "Öncelikli Destek", included: false },
      { text: "Kişiselleştirilmiş URL", included: false },
    ],
  },
  {
    name: "Orta Galeri",
    price: 3499,
    period: "ay",
    icon: <TrendingUp size={32} />,
    popular: true,
    features: [
      { text: "30 Aktif Araç İlanı", included: true },
      { text: "Gelişmiş Galeri Görünümü", included: true },
      { text: "WhatsApp API Entegrasyonu", included: true },
      { text: "Aylık Performans Raporu", included: true },
      { text: "Öncelikli Destek", included: true },
      { text: "Kişiselleştirilmiş URL", included: true },
    ],
  },
  {
    name: "Büyük Galeri",
    price: 9999,
    period: "ay",
    icon: <Star size={32} />,
    features: [
      { text: "Sınırsız Aktif Araç İlanı", included: true },
      { text: "Premium Galeri Görünümü", included: true },
      { text: "Tam Entegre WhatsApp CRM", included: true },
      { text: "Haftalık Performans Raporu", included: true },
      { text: "7/24 Öncelikli Destek", included: true },
      { text: "Özel Domain & Marka", included: true },
    ],
  },
];

// Additional features section
const additionalFeatures = [
  {
    icon: <Zap size={40} />,
    title: "Hızlı Satış",
    desc: "Doping paketleri ile aracınızı piyasanın 10 kat daha hızlı görünür hale getirin. Ortalama satış süresini %70 azaltın.",
  },
  {
    icon: <TrendingUp size={40} />,
    title: "Daha Görünürlük",
    desc: "Vitrinde öne çıkın, arama sonuçlarında üst sıralara yer alın. Milyonlarca ziyaretçi tarafından keşfedilsin.",
  },
  {
    icon: <Users size={40} />,
    title: "Kurumsal Güven",
    desc: "Kurumsal galeri paketleri ile markanızı profesyonel bir görünümde sunun. Müşteri güvenini %200 artırın.",
  },
  {
    icon: <MessageCircle size={40} />,
    title: "Doğrudan İletişim",
    desc: "Potansiyel alıcılarla WhatsApp üzerinden anında bağlantı kurun. Dönüşüm oranınızı %150 artırın.",
  },
];

// Trust badges
const trustBadges = [
  { icon: <Lock size={24} />, text: "256-bit SSL Güvenlik" },
  { icon: <ShieldCheck size={24} />, text: "TC Kimlik Doğrulama" },
  { icon: <Check size={24} />, text: "Plaka & Şasi Kontrolü" },
  { icon: <Truck size={24} />, text: "Kargo Takibi Desteği" },
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
            <span>En Düşük Komisyon - En Yüksek Dönüşüm</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            Araç Satışınızı{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Hızlandırın
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            İlan verme tamamen <span className="font-semibold text-foreground">ücretsiz</span>.
            Doping paketleri fiyatı piyasanın{" "}
            <span className="font-semibold text-primary">1/10&apos;u</span> ile aracınızı
            milyonlarca kişiye ulaştırın.
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
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-sm font-medium">
                <div className="text-primary">{badge.icon}</div>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Features Section */}
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
            {freeFeatures.map((feature, index) => (
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

      {/* Doping Packages Section */}
      <section id="doping-paketleri" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Doping Paketleri
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Fiyatları piyasanın <span className="font-bold text-primary">1/10&apos;u</span> ile
              maksimum dönüşüm. Tüm doping paketleri aylık abonelik şeklindedir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {dopingPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-card border-2 rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
                  pkg.popular
                    ? "border-primary shadow-2xl shadow-primary/20 scale-105 md:scale-110"
                    : "border-border hover:border-primary/30 hover:shadow-xl"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
                    EN POPÜLER
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    {pkg.name}
                  </h3>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-primary">
                      ₺{pkg.price}
                    </span>
                    <span className="text-muted-foreground mb-1">/{pkg.period}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground line-through">
                      ₺{pkg.originalPrice}
                    </span>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      %{Math.round((1 - pkg.price / pkg.originalPrice) * 100)} indirim
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
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
                          <XMark size={14} />
                        )}
                      </div>
                      <span
                        className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground line-through"}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    pkg.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-2 border-border bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  Seç
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
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
            {additionalFeatures.map((feature, index) => (
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
      <section className="py-20 md:py-28 bg-muted/20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Kurumsal Planlar
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Profesyonel galeri sahipleri ve büyük çaplı lot tedarikçiler için özel tasarlanmış
              planlar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {corporatePlans.map((plan) => (
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
                          <XMark size={14} />
                        )}
                      </div>
                      <span
                        className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground line-through"}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard/plans"
                  className={`inline-flex justify-center w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-2 border-border bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  Detayları Gör
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard/plans"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Tüm Kurumsal Planları İncele
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

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

// XMark icon component for close/disabled states
function XMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
