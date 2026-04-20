import Image from "next/image"
import { Search, CarFront, MapPin, ChevronRight, Sparkles } from "lucide-react"

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
          alt="Premium car marketplace hero"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-3xl text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-5 py-2 text-blue-400 text-xs font-bold uppercase tracking-[0.2em]">
            Yeni Nesil Pazaryeri
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[0.9]">
              Arabanı <span className="text-blue-500">Kolayca</span> Sat. <br />
              Doğruyu <span className="text-indigo-400">Hızlıca</span> Bul.
            </h1>
            <p className="text-xl text-slate-300 max-w-xl font-medium leading-relaxed">
              Türkiye&apos;nin en güvenilir, şeffaf ve yüksek teknolojili otomobil pazarı. 
              Sade deneyim, tam güven.
            </p>
          </div>

          <form
            action="/listings"
            method="GET"
            className="group/form bg-white/10 p-2 rounded-2xl border border-white/20 shadow-lg max-w-4xl flex flex-col md:flex-row gap-2 transition-all hover:bg-white/15"
          >
            <div className="flex-1 flex flex-col md:flex-row gap-2 p-2">
              <div className="flex-1 relative">
                <CarFront size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text" 
                  name="query"
                  placeholder="Marka, model veya ilan başlığı..." 
                  className="w-full bg-white/10 border-none text-white placeholder:text-white/30 rounded-xl pl-14 pr-6 h-14 outline-none transition focus:bg-white/20 font-bold"
                />
              </div>

              <div className="w-full md:w-56 relative">
                <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <select 
                  name="city"
                  className="w-full bg-white/10 border-none text-white rounded-xl pl-14 pr-10 h-14 outline-none appearance-none cursor-pointer focus:bg-white/20 font-bold"
                >
                  <option value="" className="bg-slate-900">Tüm Şehirler</option>
                  {cities.map((city) => (
                    <option key={city} value={city} className="bg-slate-900">{city}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                   <ChevronRight size={14} className="rotate-90 text-white/40" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="m-1 bg-white text-slate-950 font-bold rounded-xl px-10 h-16 transition-all hover:bg-blue-500 hover:text-white active:scale-95 shadow-md flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest"
            >
              <Search size={18} strokeWidth={3} />
              İLANLARI KEŞFET
            </button>
          </form>

          <div className="flex items-center gap-8 pt-6">
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-none tracking-tighter">10K+</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Aktif İlan</span>
             </div>
             <div className="h-8 w-px bg-white/10" />
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-none tracking-tighter">2M+</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Aylık Ziyaret</span>
             </div>
             <div className="h-8 w-px bg-white/10" />
             <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-none tracking-tighter">4.9/5</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kullanıcı Memnuniyeti</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
