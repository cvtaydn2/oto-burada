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
  const [city, setCity] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    let url = `/listings?query=${encodeURIComponent(query.trim())}`
    if (city) url += `&city=${encodeURIComponent(city)}`
    if (maxPrice) url += `&maxPrice=${maxPrice}`
    router.push(url)
  }

  return (
    <section className="relative w-full mb-20 overflow-visible">
      {/* Background Frame */}
      <div className="relative h-[500px] lg:h-[600px] w-full overflow-hidden rounded-[40px] lg:rounded-[64px] bg-slate-900">
        <img 
          src="/hero_luxury_car_black_1776035280175.png" 
          alt="Luxury Car Showcase" 
          className="w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Centered Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pb-20">
          <h1 className="text-4xl md:text-7xl font-black text-white tracking-tightest mb-6 leading-tight max-w-4xl font-heading animate-in fade-in slide-in-from-bottom-8 duration-700">
            Hayalindeki Aracı Bugün Bul
          </h1>
          <p className="text-base md:text-xl text-white/80 max-w-2xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Türkiye&apos;nin en geniş araç ağıyla, güvenli ve hızlı otomobil alışverişinin adresi.
          </p>
        </div>
      </div>

      {/* Floating Search Card */}
      <div className="absolute left-1/2 -bottom-10 lg:-bottom-12 -translate-x-1/2 w-full max-w-5xl px-6 animate-in zoom-in-95 duration-1000 delay-300">
        <form 
          onSubmit={handleSearch}
          className="bg-white rounded-[24px] lg:rounded-[32px] p-2.5 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-2"
        >
          {/* Marka / Model */}
          <div className="flex-1 px-4 lg:px-6 py-4 flex flex-col gap-1 border-b lg:border-b-0 lg:border-r border-slate-100">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">MARKİ / MODEL</label>
            <input 
              type="text" 
              placeholder="Örn: BMW 3 Serisi" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0"
            />
          </div>

          {/* Şehir */}
          <div className="flex-1 px-4 lg:px-6 py-4 flex flex-col gap-1 border-b lg:border-b-0 lg:border-r border-slate-100">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ŞEHİR</label>
            <select 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="">Tüm Şehirler</option>
              <option value="İstanbul">İstanbul</option>
              <option value="Ankara">Ankara</option>
              <option value="İzmir">İzmir</option>
            </select>
          </div>

          {/* Fiyat Aralığı */}
          <div className="flex-1 px-4 lg:px-6 py-4 flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">FİYAT ARALIĞI</label>
            <input 
              type="number" 
              placeholder="Maksimum TL" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0"
            />
          </div>

          {/* Search Button */}
          <button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-[18px] lg:rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Search size={18} />
            İlanları Ara
          </button>
        </form>
      </div>
    </section>
  )
}
