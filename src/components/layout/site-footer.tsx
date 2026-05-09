import { CarFront, CheckCircle2, MessageCircle, Shield, Users } from "lucide-react";
import Link from "next/link";

import { FooterNavLink } from "@/components/layout/footer-nav-link";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";
import { CURRENT_YEAR } from "@/lib/date-utils";

const quickLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/listings", label: "Tüm İlanlar" },
  { href: "/dashboard/listings", label: "Ücretsiz İlan Ver" },
  { href: "/login", label: "Giriş Yap" },
];

const trustFeatures = [
  { icon: Shield, label: "Moderasyon", description: "Tüm ilanlar kontrol edilir" },
  { icon: Users, label: "Güven Sinyalleri", description: "Profil ve ilan bilgileri görünür" },
  { icon: MessageCircle, label: "WhatsApp", description: "Direkt iletişim" },
  { icon: CheckCircle2, label: "Ücretsiz", description: "İlan vermek bedava" },
];

export async function SiteFooter() {
  const references = await getLiveMarketplaceReferenceData();

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25">
                <CarFront size={20} />
              </div>
              <span className="text-xl font-bold text-foreground">OtoBurada</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Arabalar için sade, güven odaklı ve ücretsiz ilan deneyimi. Arabanı sat, hayalindeki
              arabayı bul.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                {references.brands.length}+ Marka
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {references.cities.length} Şehir
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Ücretsiz İlan
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Hızlı Erişim
            </h3>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <FooterNavLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Popüler Markalar
            </h3>
            <ul className="mt-5 space-y-3">
              {references.brands.slice(0, 6).map((brand) => (
                <li key={brand.slug}>
                  <Link
                    href={`/satilik/${brand.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {brand.brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Neden OtoBurada?
            </h3>
            <div className="mt-5 space-y-4">
              {trustFeatures.map((feature) => (
                <div key={feature.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {CURRENT_YEAR} OtoBurada. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="transition-colors hover:text-primary">
              Gizlilik Politikası
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-primary">
              Kullanım Şartları
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              İletişim
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
