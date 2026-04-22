import Image from "next/image"
import { Search, CarFront, MapPin, ChevronRight } from "lucide-react"

interface HomeHeroProps {
  cities: string[];
}

export function HomeHero({ cities }: HomeHeroProps) {
  return (
    <section className="relative min-h-[500px] sm:min-h-[550px] md:min-h-[600px] flex items-center justify-center overflow-hidden pt-16 pb-10 sm:pt-20 sm:pb-12 md:py-0">
      <div className="absolute inset-0 bg-background" />

      {/* Mobile background */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <Image
          src="/images/hero_bg.png"
          alt="Satılık araba ilanları"
          fill
          loading="eager"
          sizes="100vw"
          quality={85}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full relative z-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10 xl:gap-16">
          <div className="relative hidden min-h-[440px] overflow-hidden rounded-[3rem] lg:block lg:mr-2 xl:mr-4">
            <Image
              src="/images/hero_bg.png"
              alt="Satılık araba ilanları"
              fill
              priority
              sizes="(max-width: 1280px) 42vw, 560px"
              quality={85}
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/10 via-transparent to-background/55" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="max-w-3xl text-left space-y-6 sm:space-y-8 lg:max-w-none lg:pl-2 xl:pl-4">
          <div className="inline-flex items-center gap-2 bg-foreground/10 border border-foreground/10 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-foreground/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
            Sade Araç Pazaryeri
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
              Arabanı <span className="text-primary underline decoration-primary/30 underline-offset-4 sm:underline-offset-8">Kolayca</span> Sat. <br />
              Doğruyu <span className="text-foreground/90">Hızlıca</span> Bul.
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl font-medium leading-relaxed">
              Türkiye&apos;nin en güvenilir, şeffaf ve sade otomobil pazarı. 
              Gereksiz detaylardan uzak, sadece sonuca odaklı.
            </p>
          </div>

          <form
            action="/listings"
            method="GET"
            className="group/form bg-card/80 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-border shadow-sm max-w-4xl flex flex-col md:flex-row gap-1 sm:gap-2 transition-all hover:bg-card/90 backdrop-blur-lg"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-1 sm:gap-2 p-1 sm:p-2">
              <div className="flex-1 relative">
                <CarFront size={16} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  name="query"
                  placeholder="Marka, model..." 
                  className="w-full bg-muted/50 border-none text-foreground placeholder:text-muted-foreground/50 rounded-lg sm:rounded-xl pl-10 sm:pl-14 pr-3 sm:pr-6 h-11 sm:h-14 outline-none transition focus:bg-muted font-medium text-sm sm:text-base"
                />
              </div>

              <div className="w-full md:w-56 relative">
                <MapPin size={16} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <select 
                  name="city"
                  className="w-full bg-muted/50 border-none text-foreground rounded-lg sm:rounded-xl pl-10 sm:pl-14 pr-8 sm:pr-10 h-11 sm:h-14 outline-none appearance-none cursor-pointer focus:bg-muted font-medium text-sm sm:text-base"
                >
                  <option value="" className="bg-card">Tüm Şehirler</option>
                  {cities.map((city) => (
                    <option key={city} value={city} className="bg-card">{city}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                   <ChevronRight size={14} className="rotate-90 text-muted-foreground" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="m-0.5 sm:m-1 bg-primary text-primary-foreground font-bold rounded-lg sm:rounded-xl px-4 sm:px-8 md:px-10 h-11 sm:h-14 md:h-16 transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 uppercase text-[9px] sm:text-[10px] md:text-[11px] tracking-widest"
            >
              <Search size={18} strokeWidth={2} />
              <span className="hidden sm:inline">İLANLARI KEŞFET</span>
              <span className="sm:hidden">KEŞFET</span>
            </button>
          </form>

          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 pt-4 sm:pt-6">
             <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-foreground leading-none tracking-tighter">10K+</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Aktif İlan</span>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-foreground leading-none tracking-tighter">%100</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Ücretsiz İlan</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 sm:gap-6 md:gap-8">
                <div className="w-px h-6 sm:h-8 bg-border" />
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold text-foreground leading-none tracking-tighter">7/24</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Destek</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground leading-none tracking-tighter">2M+</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Aylık Ziyaret</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground leading-none tracking-tighter">4.9/5</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Kullanıcı Memnuniyeti</span>
                </div>
              </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
