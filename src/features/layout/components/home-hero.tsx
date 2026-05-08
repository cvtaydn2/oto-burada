import { ChevronRight, MapPin, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/features/ui/components/button";
import { Label } from "@/features/ui/components/label";
import { SearchWithSuggestions } from "@/features/ui/components/search-with-suggestions";
import type { SearchSuggestionItem } from "@/types";

interface HomeHeroProps {
  cities: string[];
  searchSuggestions: SearchSuggestionItem[];
}

const quickSearchLinks = [
  { href: "/listings?hasExpertReport=true", label: "Ekspertizli" },
  { href: "/listings?transmission=otomatik", label: "Otomatik" },
  { href: "/listings?maxMileage=80000&sort=mileage_asc", label: "Düşük KM" },
  { href: "/listings?sort=newest", label: "En Yeni" },
] as const;

export function HomeHero({ cities, searchSuggestions }: HomeHeroProps) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pb-8 pt-14 sm:pb-10 sm:pt-16 md:min-h-[520px] md:py-0 lg:min-h-[580px]">
      <div className="absolute inset-0 bg-background" />

      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_bg.webp"
          alt="Satılık araba ilanları"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 42vw, 560px"
          quality={80}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90 lg:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background/5 via-transparent to-background/50 lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 xl:gap-12">
          <div className="relative hidden min-h-[380px] lg:mr-2 lg:block xl:mr-4" />

          <div className="max-w-2xl space-y-6 text-left sm:space-y-8 lg:max-w-none lg:pl-2 xl:pl-4">
            <div className="animate-in inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-sm backdrop-blur-md duration-700 fill-mode-both sm:py-2 fade-in slide-in-from-bottom-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Sade Araç Pazaryeri
            </div>

            <div className="animate-in space-y-4 duration-700 delay-150 fill-mode-both fade-in slide-in-from-bottom-4">
              <h1 className="text-3xl font-extrabold leading-[1.25] sm:leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl">
                Arabanı{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Kolayca
                </span>{" "}
                Sat. <br />
                Doğruyu{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Hızlıca
                </span>{" "}
                Bul.
              </h1>
              <p className="max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                Türkiye&apos;nin en güvenilir, şeffaf ve sade otomobil pazarı. Dakikalar içinde ilan
                ver veya aradığın aracı anında bul.
              </p>
            </div>

            <div className="animate-in rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl duration-700 delay-300 fill-mode-both fade-in slide-in-from-bottom-4">
              <div className="space-y-3">
                <div className="relative rounded-xl border border-border/80 bg-muted/70 p-1">
                  <SearchWithSuggestions
                    id="hero-search-input"
                    placeholder="Marka, model veya şehir ara..."
                    suggestions={searchSuggestions}
                    className="max-w-none"
                    formId="home-hero-search-form"
                  />
                </div>

                <form
                  id="home-hero-search-form"
                  action="/listings"
                  method="GET"
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <div className="relative w-full sm:w-56 lg:w-64 group">
                    <Label htmlFor="hero-city" className="sr-only">
                      Şehir seç
                    </Label>
                    <MapPin
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                    />
                    <select
                      id="hero-city"
                      name="city"
                      className="h-14 w-full appearance-none rounded-xl border border-border/80 bg-muted/70 pl-12 pr-10 text-base font-medium text-foreground outline-none transition-all focus:border-primary/20 focus:bg-background"
                    >
                      <option value="">Tüm Şehirler</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronRight
                        size={16}
                        className="rotate-90 text-muted-foreground transition-transform group-focus-within:-rotate-90 group-focus-within:text-primary"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold tracking-wide text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] sm:w-auto"
                    aria-label="Şehir seçimiyle ilanları keşfet"
                  >
                    <Search size={18} strokeWidth={2.5} />
                    İlanları Keşfet
                  </Button>
                </form>

                <div className="flex flex-wrap gap-2 pt-1">
                  {quickSearchLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/30 hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/listings/filter"
                    className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
                  >
                    Detaylı Filtrele
                  </Link>
                </div>
              </div>
            </div>

            <div className="animate-in flex flex-wrap items-center gap-4 pt-2 duration-700 delay-500 fill-mode-both fade-in slide-in-from-bottom-4 sm:gap-6">
              <Link
                href="/dashboard/listings/create"
                className="group flex items-center gap-1 text-sm font-semibold text-primary transition hover:underline underline-offset-4"
              >
                Ücretsiz İlan Ver
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground sm:text-sm">
                <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-2.5 py-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  7/24 Destek
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-2.5 py-1">
                  Moderasyonlu
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-2.5 py-1">
                  WhatsApp ile Hızlı İletişim
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
