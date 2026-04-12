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
    <section className="relative w-full py-16 lg:py-32 overflow-hidden rounded-[48px] mb-12 bg-[#0A0D14] shadow-2xl">
      {/* Premium Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero_luxury_car_black_1776035280175.png" 
          alt="Luxury Car" 
          className="w-full h-full object-cover opacity-50 contrast-125 saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14] via-[#0A0D14]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0A0D14] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-8 lg:px-16 flex flex-col items-center md:items-start text-center md:text-left">
        {/* Trust Element */}
        <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-1000">
           <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="size-10 rounded-full border-4 border-[#0A0D14] bg-slate-800 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                   <img src={`https://i.pravatar.cc/100?u=${i*123}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
           <div className="flex flex-col gap-0.5">
              <div className="flex gap-0.5">
                 {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-white/50 italic">
                <span className="text-primary">+15.000</span> GÜVENLİ İŞLEM
              </span>
           </div>
        </div>

        <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1] max-w-3xl drop-shadow-2xl font-heading">
          HAYALİNDEKİ <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 italic">
            OTOMOBİL
          </span> <br />
          BURADA.
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-xl mb-12 font-medium italic leading-relaxed">
          Türkiye&apos;nin en şeffaf ve güven odaklı otomobil pazarı. 
          Sizin için seçilmiş, ekspertiz onaylı ilanlarla huzurla tanışın.
        </p>

        {/* The Power Search Bar (Optimized for Conversion) */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-2xl bg-white/5 p-2 rounded-[32px] backdrop-blur-3xl shadow-2xl mb-6 group transition-all border border-white/10 hover:border-white/20"
        >
          <div className="relative flex items-center bg-white rounded-2xl h-16 sm:h-24 shadow-2xl px-3 overflow-hidden">
            <div className="hidden sm:flex items-center px-6 border-r border-slate-100 h-12 gap-3 text-slate-400 bg-slate-50/50 rounded-xl mr-3">
               <Shield size={20} className="text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest italic">DOĞRULANMIŞ</span>
            </div>
            
            <Search className="ml-2 text-slate-300 group-focus-within:text-primary transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Marka, model veya şehir..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-full px-4 text-lg md:text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent"
            />
            
            <button 
              type="submit"
              className="h-12 sm:h-18 px-10 sm:px-14 rounded-xl bg-slate-900 text-white font-black text-lg md:text-xl hover:bg-black active:scale-95 transition-all shadow-xl shadow-black/20 italic uppercase tracking-tighter"
            >
              ARA
            </button>
          </div>
        </form>

        {/* Model Chips */}
        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-14 overflow-hidden w-full max-w-2xl">
           {(["Fiat Egea", "Renault Clio", "Toyota Corolla", "VW Passat"] as const).map((suggestion, idx) => (
             <button
               key={suggestion}
               onClick={() => {
                 setQuery(suggestion);
                 router.push(`/listings?query=${encodeURIComponent(suggestion)}`)
               }}
               className="h-10 px-5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[11px] font-black uppercase tracking-widest hover:bg-white/20 hover:text-white transition-all whitespace-nowrap italic animate-in fade-in slide-in-from-bottom-2"
               style={{ animationDelay: `${idx * 100}ms` }}
             >
                {suggestion}
             </button>
           ))}
        </div>

        {/* Brand Group */}
        <div className="w-full grid grid-cols-2 sm:flex sm:flex-wrap justify-center md:justify-start gap-3">
           {POPULAR_BRANDS.slice(0, 6).map((brand, idx) => (
             <button 
               key={brand}
               onClick={() => handleBrandSelect(brand.toLowerCase().replace(/[^a-z]/g, "-"))}
               className={cn(
                  "h-14 px-5 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 group/brand animate-in fade-in slide-in-from-left-4",
                  getBrandColor(brand)
               )}
               style={{ animationDelay: `${(idx + 4) * 100}ms` }}
             >
                <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black group-hover/brand:bg-black/5 transition-colors border border-white/5">
                  {brand === "Mercedes-Benz" ? "MB" : brand.slice(0, 2).toUpperCase()}
                </div>
                {brand}
             </button>
           ))}
        </div>
      </div>
    </section>
  )
}
