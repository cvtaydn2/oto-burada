import Image from "next/image"
import { Search, CarFront, MapPin, ChevronRight } from "lucide-react"

interface HomeHeroProps {
  cities: string[];
}

export function HomeHero({ cities }: HomeHeroProps) {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden pt-20 pb-16 md:py-0">
      {/* Background with advanced gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=2000&q=80"
          alt="Satılık araba ilanları"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
          quality={85}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-3xl text-left space-y-8">
          <div className="inline-flex items-center gap-2 bg-foreground/10 border border-foreground/10 rounded-full px-5 py-2 text-foreground/80 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
            Sade Araç Pazaryeri
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
              Arabanı <span className="text-primary underline decoration-primary/30 underline-offset-8">Kolayca</span> Sat. <br />
              Doğruyu <span className="text-foreground/90">Hızlıca</span> Bul.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl font-medium leading-relaxed">
              Türkiye&apos;nin en güvenilir, şeffaf ve sade otomobil pazarı. 
              Gereksiz detaylardan uzak, sadece sonuca odaklı.
            </p>
          </div>

          <form
            action="/listings"
            method="GET"
            className="group/form bg-card/80 p-2 rounded-2xl border border-border shadow-sm max-w-4xl flex flex-col md:flex-row gap-2 transition-all hover:bg-card/90 backdrop-blur-lg"
          >
            <div className="flex-1 flex flex-col md:flex-row gap-2 p-2">
              <div className="flex-1 relative">
                <CarFront size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  name="query"
                  placeholder="Marka, model veya ilan başlığı..." 
                  className="w-full bg-muted/50 border-none text-foreground placeholder:text-muted-foreground/50 rounded-xl pl-14 pr-6 h-14 outline-none transition focus:bg-muted font-medium"
                />
              </div>

              <div className="w-full md:w-56 relative">
                <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <select 
                  name="city"
                  className="w-full bg-muted/50 border-none text-foreground rounded-xl pl-14 pr-10 h-14 outline-none appearance-none cursor-pointer focus:bg-muted font-medium"
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
              className="m-1 bg-primary text-primary-foreground font-bold rounded-xl px-10 h-16 transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest"
            >
              <Search size={18} strokeWidth={2} />
              İLANLARI KEŞFET
            </button>
          </form>

          <div className="flex items-center gap-8 pt-6">
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground leading-none tracking-tighter">10K+</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Aktif İlan</span>
             </div>
             <div className="h-8 w-px bg-border" />
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground leading-none tracking-tighter">2M+</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Aylık Ziyaret</span>
             </div>
             <div className="h-8 w-px bg-border" />
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground leading-none tracking-tighter">4.9/5</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Kullanıcı Memnuniyeti</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
