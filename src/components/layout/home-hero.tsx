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
          src="/images/hero_bg.png"
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

          <div className="max-w-2xl text-left space-y-5 sm:space-y-6 lg:max-w-none lg:pl-2 xl:pl-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 sm:py-2 text-primary text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
              Sade Araç Pazaryeri
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground tracking-tight leading-[1.15]">
                Arabanı <span className="text-primary">Kolayca</span> Sat. <br />
                Doğruyu <span className="text-primary">Hızlıca</span> Bul.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg font-medium leading-relaxed">
                Türkiye&apos;nin en güvenilir, şeffaf ve sade otomobil pazarı.
              </p>
            </div>

            <form
              action="/listings"
              method="GET"
              className="bg-card/90 p-1.5 rounded-xl sm:rounded-2xl border border-border shadow-lg max-w-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                <div className="flex-1 relative">
                  <label htmlFor="hero-query" className="sr-only">
                    Marka veya model ara
                  </label>
                  <CarFront
                    size={16}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="hero-query"
                    type="text"
                    name="query"
                    placeholder="Marka, model ara..."
                    className="w-full bg-muted/40 border-none text-foreground placeholder:text-muted-foreground/50 rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 h-12 sm:h-14 outline-none transition focus:bg-muted font-medium text-sm"
                  />
                </div>

                <div className="w-full sm:w-44 lg:w-48 relative">
                  <label htmlFor="hero-city" className="sr-only">
                    Şehir seç
                  </label>
                  <MapPin
                    size={16}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <select
                    id="hero-city"
                    name="city"
                    className="w-full bg-muted/40 border-none text-foreground rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-8 sm:pr-10 h-12 sm:h-14 outline-none appearance-none cursor-pointer focus:bg-muted font-medium text-sm"
                  >
                    <option value="">Tüm Şehirler</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight size={14} className="rotate-90 text-muted-foreground" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-primary text-primary-foreground font-bold rounded-lg sm:rounded-xl px-5 sm:px-6 h-12 sm:h-14 transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <Search size={16} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Keşfet</span>
                  <span className="sm:hidden">Ara</span>
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 sm:pt-3">
              <Link
                href="/dashboard/listings/create"
                className="text-sm font-semibold text-primary hover:underline underline-offset-4 transition"
              >
                Ücretsiz İlan Ver →
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  7/24 Destek
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Moderasyonlu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
