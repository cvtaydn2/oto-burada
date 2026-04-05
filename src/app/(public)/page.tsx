import Link from "next/link";
import { ArrowRight, BadgeCheck, CarFront, ShieldCheck } from "lucide-react";

const trustHighlights = [
  {
    title: "Sadece araba ilanları",
    description: "Daha sade gezinme ve daha hızlı filtreleme için ürün odağını net tutuyoruz.",
    icon: CarFront,
  },
  {
    title: "Güven odaklı deneyim",
    description: "Moderasyon, net bilgi hiyerarşisi ve şüpheli ilan bildirme akışı merkezdedir.",
    icon: ShieldCheck,
  },
  {
    title: "Mobilde hızlı kullanım",
    description: "Karmaşayı azaltan bileşenler ve büyük dokunma alanları ile akışlar kolay ilerler.",
    icon: BadgeCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-muted/40">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Ücretsiz bireysel araba ilanları
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                Faz 0 kurulumu tamamlandı
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Arabanı kolayca sat. Doğru arabayı hızlıca bul.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Oto Burada, sadece arabalar için tasarlanmış sade ve güvenilir bir pazaryeri
                altyapısı sunar. Bu başlangıç ekranı proje iskeletinin, tema sisteminin ve temel
                bağımlılıkların hazır olduğunu gösterir.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/listings"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                İlanları İncele
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#neden-oto-burada"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Neden Oto Burada?
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
            <div className="rounded-[1.5rem] border border-dashed border-primary/25 bg-primary/5 p-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Bootstrap Özeti</p>
                <h2 className="text-2xl font-semibold tracking-tight">Lean MVP temeli hazır</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Next.js App Router, TypeScript, Tailwind, shadcn/ui ve veri katmanı için gerekli
                  temel paketler proje kökünde yapılandırıldı.
                </p>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-background p-4">
                  <dt className="text-sm text-muted-foreground">UI altyapısı</dt>
                  <dd className="mt-1 text-lg font-semibold">Tailwind + shadcn/ui</dd>
                </div>
                <div className="rounded-2xl bg-background p-4">
                  <dt className="text-sm text-muted-foreground">Form ve doğrulama</dt>
                  <dd className="mt-1 text-lg font-semibold">React Hook Form + Zod</dd>
                </div>
                <div className="rounded-2xl bg-background p-4">
                  <dt className="text-sm text-muted-foreground">Veri yönetimi</dt>
                  <dd className="mt-1 text-lg font-semibold">TanStack Query</dd>
                </div>
                <div className="rounded-2xl bg-background p-4">
                  <dt className="text-sm text-muted-foreground">Backend hazırlığı</dt>
                  <dd className="mt-1 text-lg font-semibold">Supabase istemcileri</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section
        id="neden-oto-burada"
        className="border-y border-border/70 bg-background"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          {trustHighlights.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5 shadow-sm"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
