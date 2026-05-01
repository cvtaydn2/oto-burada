import { CarFront, ChevronRight, MapPin, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HomeHeroProps {
  cities: string[];
}

export function HomeHero({ cities }: HomeHeroProps) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-14 pb-8 sm:pt-16 sm:pb-10 md:py-0 md:min-h-[520px] lg:min-h-[580px]">
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
        <div className="absolute inset-0 bg-gradient-to-r from-background/5 via-transparent to-background/50 hidden lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 w-full relative z-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 xl:gap-12">
          <div className="relative hidden min-h-[380px] lg:block lg:mr-2 xl:mr-4">
            {/* The image is handled by the shared background Image above for better performance and preload alignment */}
          </div>

          <div className="max-w-2xl text-left space-y-6 sm:space-y-8 lg:max-w-none lg:pl-2 xl:pl-4">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 sm:py-2 text-primary text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Sade Araç Pazaryeri
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
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
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl font-medium leading-relaxed">
                Türkiye&apos;nin en güvenilir, şeffaf ve sade otomobil pazarı. Dakikalar içinde ilan
                ver veya aradığın aracı anında bul.
              </p>
            </div>

            <form
              action="/listings"
              method="GET"
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both bg-card/95 p-2 rounded-2xl border border-border shadow-2xl max-w-2xl backdrop-blur-xl transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative group">
                  <label htmlFor="hero-query" className="sr-only">
                    Marka veya model ara
                  </label>
                  <CarFront
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                  />
                  <input
                    id="hero-query"
                    type="text"
                    name="query"
                    placeholder="Marka, model ara..."
                    className="w-full bg-muted/50 border border-transparent text-foreground placeholder:text-muted-foreground/60 rounded-xl pl-12 pr-4 h-14 outline-none transition-all focus:bg-background focus:border-border font-medium text-base"
                  />
                </div>

                <div className="w-full sm:w-48 lg:w-56 relative group">
                  <label htmlFor="hero-city" className="sr-only">
                    Şehir seç
                  </label>
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary"
                  />
                  <select
                    id="hero-city"
                    name="city"
                    className="w-full bg-muted/50 border border-transparent text-foreground rounded-xl pl-12 pr-10 h-14 outline-none appearance-none cursor-pointer transition-all focus:bg-background focus:border-border font-medium text-base"
                  >
                    <option value="">Tüm Şehirler</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight
                      size={16}
                      className="rotate-90 text-muted-foreground transition-transform group-focus-within:rotate-[-90deg] group-focus-within:text-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-primary text-primary-foreground font-bold rounded-xl px-8 h-14 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2 text-base tracking-wide group"
                >
                  <Search
                    size={18}
                    strokeWidth={2.5}
                    className="transition-transform group-hover:scale-110"
                  />
                  <span className="hidden sm:inline">Keşfet</span>
                  <span className="sm:hidden">Ara</span>
                </button>
              </div>
            </form>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
              <Link
                href="/dashboard/listings/create"
                className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline underline-offset-4 transition group"
              >
                Ücretsiz İlan Ver
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                  7/24 Destek
                </span>
                <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">
                  Moderasyonlu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
