import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

import type { BrandCatalogItem, CityOption } from "@/types";

interface HomeTrustAndSearchProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
}

export function HomeTrustAndSearch({ brands, cities }: HomeTrustAndSearchProps) {
  return (
    <>
      <section className="border-y border-border bg-muted/30 py-10 sm:py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
          <div className="mb-10 text-center sm:mb-14">
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Güvenilir Araç Pazarı
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              Tüm ilanlar moderasyondan geçer ve şeffaf fiyatlandırma ile sunulur. Hayalindeki araca
              güvenle ulaş.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                icon: <ShieldCheck size={24} />,
                title: "Moderasyon",
                desc: "Tüm ilanlar inceleme sürecinden geçer. Şüpheli içerikler engellenir.",
              },
              {
                icon: <CheckCircle2 size={24} />,
                title: "Ekspertiz Desteği",
                desc: "Araç geçmişi ve teknik durum şeffaf şekilde paylaşılır.",
              },
              {
                icon: <Zap size={24} />,
                title: "Hızlı İletişim",
                desc: "Satıcılarla doğrudan WhatsApp üzerinden iletişim kurun.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 sm:p-8"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-lg font-bold text-card-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-10 sm:py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col justify-center">
              <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Neden OtoBurada?
              </h2>
              <p className="mb-8 text-base text-muted-foreground">
                OtoBurada ile ikinci el araba alım satım işlemlerinizi hızlı, şeffaf ve güvenli bir
                şekilde gerçekleştirin. Sizi anlayan, modern bir pazaryeri deneyimi sunuyoruz.
              </p>
              <ul className="space-y-4">
                {[
                  "Ücretsiz ilan verme ve anında onaya sunma imkanı",
                  "Uzman moderasyon ekibi ile güvenilir satıcı profilleri",
                  "Gelişmiş filtreleme ile doğru araca 3 adımda hızlı ulaşım",
                  "WhatsApp üzerinden anında, kesintisiz satıcı iletişimi",
                  "Mobil uyumlu, yüksek performanslı premium kullanıcı deneyimi",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                    <span className="leading-snug text-foreground/90">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h3 className="mb-4 text-lg font-bold text-foreground">Popüler Arama</h3>
              <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { href: "/listings?hasExpertReport=true", label: "Ekspertizli İlanlar" },
                  { href: "/listings?transmission=otomatik", label: "Otomatik Vites" },
                  {
                    href: "/listings?maxMileage=80000&sort=mileage_asc",
                    label: "Düşük Kilometre",
                  },
                  { href: "/listings?sort=newest", label: "En Yeni İlanlar" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-muted/20 px-4 py-3 text-center text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Markalar
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {brands.slice(0, 5).map((b) => (
                      <li key={b.slug}>
                        <Link
                          href={`/satilik/${b.slug}`}
                          prefetch={false}
                          className="inline-block min-h-[32px] py-1 text-muted-foreground transition-colors hover:text-primary"
                        >
                          {b.brand}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Şehirler
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {cities.slice(0, 5).map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/satilik-araba/${c.slug}`}
                          prefetch={false}
                          className="inline-block min-h-[32px] py-1 text-muted-foreground transition-colors hover:text-primary"
                        >
                          {c.city}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
