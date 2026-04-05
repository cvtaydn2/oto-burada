import Link from "next/link";

import { brandCatalog, cityOptions } from "@/data";

const quickLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/listings", label: "İlanları İncele" },
  { href: "/login", label: "Giriş Yap" },
  { href: "/register", label: "Kayıt Ol" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">Oto Burada</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Sadece araba ilanları için tasarlanmış daha sade, daha güvenli ve daha hızlı bir
              deneyim.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5">
              {brandCatalog.length}+ marka
            </span>
            <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5">
              {cityOptions.length} şehir
            </span>
            <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5">
              WhatsApp ile hızlı iletişim
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
            Hızlı Erişim
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
            Güven İlkeleri
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Sadece araba ilanları yayınlanır.</li>
            <li>İlanlar moderasyon sürecinden geçer.</li>
            <li>İlk iletişim kanalı WhatsApp CTA olarak belirlenmiştir.</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
