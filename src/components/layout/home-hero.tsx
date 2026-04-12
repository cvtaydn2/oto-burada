"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Shield, Star } from "lucide-react"
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
    <section className="relative w-full py-12 lg:py-24 overflow-hidden rounded-3xl mb-12 bg-[#0A0D14]">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/20 to-transparent opacity-50" />
        {/* We can use an image here later if needed */}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-12 flex flex-col items-center text-center">
        {/* Trust Badges */}
        <div className="flex items-center gap-2 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0D14] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter overflow-hidden">
                   <img src={`https://i.pravatar.cc/150?u=${i*100}`} alt="User" />
                </div>
              ))}
           </div>
           <div className="flex items-center gap-1.5 ml-2">
              <div className="flex gap-0.5">
                 {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
              </div>
               <span className="text-sm font-medium text-slate-400">
                  <span className="text-white font-bold">12,000+</span> kişi aracını burada buldu
               </span>
           </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
          Aradığın Araba <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic">
            Burada
          </span> Seni Bekliyor.
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mb-10 font-medium">
          Türkiye&apos;nin en güvenilir, şeffaf ve hızlı ikinci el otomobil pazarı. 
          Bireysel ilanlar her zaman ücretsiz.
        </p>

        {/* The Power Search Bar */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-3xl glass p-2 rounded-2xl shadow-2xl mb-8 group transition-all hover:bg-white/10 border-white/20"
        >
          <div className="relative flex items-center bg-white rounded-xl h-16 sm:h-20 shadow-inner px-2">
            <div className="hidden sm:flex items-center px-4 border-r border-slate-100 h-10 gap-2 text-slate-400">
               <Shield size={18} />
               <span className="text-xs font-bold uppercase tracking-wider">Güvenli</span>
            </div>
            
            <Search className="ml-4 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Marka, model, özellik veya şehir yazın..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-full px-4 text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            
            <button 
              type="submit"
              className="h-12 sm:h-16 px-6 sm:px-10 rounded-lg bg-primary text-white font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
              Ara
            </button>
          </div>
        </form>

        {/* Quick Brands with Logo Placeholders */}
        <div className="w-full flex flex-wrap justify-center gap-3">
           {POPULAR_BRANDS.map(brand => (
             <button 
               key={brand}
               onClick={() => handleBrandSelect(brand.toLowerCase().replace(/[^a-z]/g, "-"))}
               className={`h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-bold hover:bg-white hover:text-black transition-all flex items-center gap-3 ${getBrandColor(brand)}`}
             >
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black group-hover:bg-white/20 transition-colors border border-white/5">
                  {brand === "Mercedes-Benz" ? "MB" : brand.slice(0, 2).toUpperCase()}
                </span>
                {brand}
             </button>
           ))}
        </div>

      </div>
    </section>
  )
}
