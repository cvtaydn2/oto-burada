import { ArrowRight, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buildAbsoluteUrl } from "@/features/seo/lib";

const PLATFORM_PILLARS = [
  {
    icon: Zap,
    title: "Hızlı ilan akışı",
    description:
      "İlan verme sürecini kısa adımlara indirerek kullanıcıların araçlarını dakikalar içinde yayına hazırlamasını kolaylaştırıyoruz.",
  },
  {
    icon: ShieldCheck,
    title: "Moderasyon odaklı güven",
    description:
      "Her ilanı daha güvenli bir pazar yeri deneyimi için kontrol ediyor, alıcı ve satıcı tarafında daha net beklentiler oluşturuyoruz.",
  },
  {
    icon: Users,
    title: "Şeffaf iletişim",
    description:
      "WhatsApp öncelikli iletişim yapısıyla alıcıların doğrudan satıcıya ulaşmasını sade, hızlı ve anlaşılır tutuyoruz.",
  },
] as const;

const OPERATING_PRINCIPLES = [
  "Sadece otomobil odaklı net bir deneyim sunarız.",
  "Bireysel kullanıcılar için ücretsiz ilan yayınını koruruz.",
  "Mobilde daha hızlı karar verilebilmesi için gereksiz yoğunluktan kaçınırız.",
] as const;

export const metadata: Metadata = {
  title: "Hakkımızda | OtoBurada",
  description:
    "OtoBurada'nın sade, güvenli ve mobil öncelikli araç ilan deneyimini neden inşa ettiğini keşfedin.",
  alternates: {
    canonical: buildAbsoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <div className="space-y-8 sm:space-y-10 lg:space-y-14">
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.24)]">
          <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:px-10 lg:py-10">
            <div className="space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary">
                <Sparkles className="size-3.5" />
                Hakkımızda
              </div>

              <div className="space-y-3">
                <h1 className="max-w-xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  OtoBurada, araç ilanını daha sade, güvenli ve mobil uyumlu hale getirmek için
                  kuruldu.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Amacımız genel ilan sitelerindeki karmaşayı azaltmak ve sadece otomobil alım-
                  satımına odaklanan daha anlaşılır bir deneyim sunmak. Kullanıcıların hızlı ilan
                  verebildiği, alıcıların ise doğru araca daha kısa sürede ulaşabildiği bir pazar
                  yeri inşa ediyoruz.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">Ücretsiz</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Bireysel kullanıcılar için ilan yayınlama ücretsizdir.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-4">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">Güvenli</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Moderasyon, profil sinyalleri ve şeffaf iletişim ile desteklenir.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ücretsiz hesap oluştur
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border/80 bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
                >
                  Bize ulaşın
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-border/70 bg-muted">
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-slate-950/30 via-slate-950/5 to-transparent" />
                <Image
                  src="/images/hero_bg.webp"
                  alt="OtoBurada araç ilan deneyimi"
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm sm:max-w-sm lg:absolute lg:-bottom-5 lg:-left-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Daha kontrollü ilan akışı
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Herkes için daha güvenli ve daha okunabilir bir marketplace deneyimi
                      hedefliyoruz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Nasıl bir deneyim tasarlıyoruz?
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Gösterişli değil, güven veren ve hızlı hissettiren bir araç pazarı.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Ürün yaklaşımımız; net bilgi hiyerarşisi, güven oluşturan temas noktaları ve mobilde
                daha rahat taranan yüzeyler üzerine kurulu. Bu nedenle her yeni iyileştirmede
                karmaşayı artırmak yerine karar vermeyi kolaylaştıran bir dil benimsiyoruz.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-muted/25 p-5 sm:p-6 lg:p-7">
            <p className="text-sm font-semibold text-foreground">Çalışma prensiplerimiz</p>
            <div className="mt-4 space-y-3">
              {OPERATING_PRINCIPLES.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/90 px-4 py-3"
                >
                  <span className="mt-1 size-2 rounded-full bg-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Platform öncelikleri</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Kullanıcı yolculuğunu üç temel alanda sadeleştiriyoruz.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLATFORM_PILLARS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border/70 bg-card px-5 py-6 text-center shadow-sm sm:px-6 sm:py-7 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              OtoBurada’yı kullanmaya başlamak için birkaç dakikanız yeterli.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Hesabınızı oluşturup aracınızı ekleyin, moderasyon sürecini tamamlayın ve alıcılarla
              WhatsApp üzerinden hızlı şekilde iletişime geçin.
            </p>
            <div className="flex flex-col justify-center gap-3 pt-1 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
              >
                Hemen kayıt ol
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/listings"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border/80 bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
              >
                İlanlara göz at
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
