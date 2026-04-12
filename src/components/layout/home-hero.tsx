"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Shield, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { type BrandCatalogItem } from "@/types"

interface HomeHeroProps {
  brands: BrandCatalogItem[]
}

const POPULAR_BRANDS = ["Volkswagen", "BMW", "Mercedes-Benz", "Audi", "Renault", "Fiat", "Seat"]

const BRAND_COLORS: Record<string, string> = {
  "Volkswagen": "hover:bg-[#001e50]",
  "BMW": "hover:bg-[#1C69D4]",
  "Mercedes-Benz": "hover:bg-[#000000]",
  "Audi": "hover:bg-[#BB0A30]",
  "Toyota": "hover:bg-[#EB2527]",
  "Renault": "hover:bg-[#FFCC33]",
  "Fiat": "hover:bg-[#8B0000]",
  "Seat": "hover:bg-[#2F3237]",
}

function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand] || "hover:bg-primary"
}

export function HomeHero({ brands }: HomeHeroProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      router.push(`/listings?query=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleBrandSelect = (brand: string) => {
    router.push(`/listings?brand=${encodeURIComponent(brand)}`)
  }

  return (
    <section className="relative w-full py-20 lg:py-40 overflow-hidden rounded-[64px] mb-12 bg-[#05070A] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] group">
      {/* Premium Multi-Layered Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/hero_luxury_car_black_1776035280175.png" 
          alt="Luxury Car Showroom" 
          className="w-full h-full object-cover opacity-60 contrast-125 saturate-50 scale-105 group-hover:scale-100 transition-transform duration-[10000ms] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#05070A] via-[#05070A]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#05070A] to-transparent" />
        {/* Ambient mesh glow */}
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-8 lg:px-20 flex flex-col items-center md:items-start text-center md:text-left">
        {/* Elite Trust Badge */}
        <div className="flex items-center gap-4 mb-10 animate-in fade-in slide-in-from-left-8 duration-1000">
           <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="size-12 rounded-full border-4 border-[#05070A] bg-slate-800 flex items-center justify-center overflow-hidden ring-1 ring-white/10 shadow-xl">
                   <img src={`https://i.pravatar.cc/100?u=${i*500}`} alt="Buyer Profile" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="size-12 rounded-full border-4 border-[#05070A] bg-primary flex items-center justify-center ring-1 ring-white/10 shadow-xl text-[10px] font-black text-white">
                +15K
              </div>
           </div>
           <div className="flex flex-col items-start gap-0.5">
              <div className="flex gap-1">
                 {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-accent text-accent animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                TÜRKİYE'NİN EN SEÇKİN <span className="text-white/80">CAR CLUB</span> SOSYETE İLANLARI
              </span>
           </div>
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tightest mb-10 leading-[0.9] max-w-4xl font-heading animate-in fade-in slide-in-from-bottom-8 duration-700">
          PREMIUM <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-300 italic">
            DENEYİM
          </span> <br />
          HIZINDA.
        </h1>

        <p className="text-xl md:text-2xl text-white/50 max-w-2xl mb-14 font-medium italic leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Otomobil alım satımında standartları yeniden tanımlıyoruz. 
          Şeffaflık, güven ve hızın birleştiği tek nokta.
        </p>

        {/* Global Concierge Search Bar */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-3xl bg-white/5 p-2.5 rounded-[40px] backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] mb-8 group/search transition-all border border-white/10 hover:border-white/20 hover:bg-white/10 duration-500 animate-in zoom-in-95 duration-700"
        >
          <div className="relative flex items-center bg-white rounded-[32px] h-20 sm:h-28 shadow-2xl px-4 overflow-hidden">
            <div className="hidden sm:flex flex-col items-start px-8 border-r border-slate-100 h-14 justify-center gap-1 text-slate-400 mr-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">GÜVEN SİNYALİ</span>
               <div className="flex items-center gap-2">
                 <Shield size={18} className="text-primary" />
                 <span className="text-xs font-black uppercase tracking-tighter text-slate-800 italic">%100 DOĞRULANMIŞ</span>
               </div>
            </div>
            
            <Search className="ml-2 text-slate-300 group-focus-within/search:text-primary transition-colors duration-500" size={28} />
            <input 
              type="text" 
              placeholder="Marka, model, şehir veya anahtar kelime..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-full px-6 text-xl md:text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent"
            />
            
            <button 
              type="submit"
              className="h-14 sm:h-20 px-12 sm:px-16 rounded-[24px] bg-slate-900 text-white font-black text-xl md:text-2xl hover:bg-primary active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.3)] shadow-black/40 italic uppercase tracking-tighter"
            >
              KEŞFET
            </button>
          </div>
        </form>

        {/* Dynamic Model Suggestions */}
        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-16 overflow-hidden w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1200">
           {(["BMW M3", "Mercedes G63", "Porsche 911", "Audi RS6", "Tesla Plaid"] as const).map((suggestion, idx) => (
             <button
               key={suggestion}
               onClick={() => {
                 setQuery(suggestion);
                 router.push(`/listings?query=${encodeURIComponent(suggestion)}`)
               }}
               className="h-11 px-6 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-white hover:border-primary/40 transition-all whitespace-nowrap italic"
               style={{ animationDelay: `${idx * 150}ms` }}
             >
                {suggestion}
             </button>
           ))}
        </div>

        {/* Premium Brand Grid */}
        <div className="w-full grid grid-cols-2 sm:flex sm:flex-wrap justify-center md:justify-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1500">
           {POPULAR_BRANDS.slice(0, 7).map((brand, idx) => (
             <button 
               key={brand}
               onClick={() => handleBrandSelect(brand.toLowerCase().replace(/[^a-z]/g, "-"))}
               className={cn(
                  "h-16 px-6 rounded-[20px] bg-white/5 border border-white/10 text-white/70 text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 group/brand",
                  getBrandColor(brand)
               )}
               style={{ animationDelay: `${(idx + 5) * 150}ms` }}
             >
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-[11px] font-black group-hover/brand:bg-black/10 transition-colors border border-white/5 group-hover/brand:border-black/5">
                  {brand === "Mercedes-Benz" ? "MB" : brand.slice(0, 2).toUpperCase()}
                </div>
                <span className="group-hover/brand:translate-x-1 transition-transform">{brand}</span>
             </button>
           ))}
        </div>
      </div>
    </section>
  )
}
