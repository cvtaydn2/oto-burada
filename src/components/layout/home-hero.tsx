"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, CarFront } from "lucide-react"

export function HomeHero() {
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
    <section className="relative h-[500px] flex items-center mb-16 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105" 
        style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1503375822722-ec8cb7a4c7e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm">
          Hayalindeki Aracı Bugün Bul
        </h1>
        <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          Türkiye&apos;nin en geniş araç ağıyla, güvenli ve hızlı otomobil alışverişinin adresi.
        </p>

        {/* Floating Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-2xl max-w-4xl mx-auto text-left flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Marka / Model</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <CarFront size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Örn: BMW 3 Serisi" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block pl-10 p-2.5 outline-none transition"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Şehir</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} className="rotate-90 scale-x-[-1]" />
              </span>
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block pl-10 p-2.5 outline-none appearance-none cursor-pointer"
              >
                <option value="">Tüm Şehirler</option>
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1">Fiyat Aralığı</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Min TL" 
                className="w-1/2 h-11 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block p-2.5 outline-none text-sm transition" 
              />
              <input 
                type="number" 
                placeholder="Maks TL" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 h-11 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block p-2.5 outline-none text-sm transition" 
              />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              onClick={handleSearch}
              className="w-full md:w-auto h-11 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg px-8 transition shadow-md flex items-center justify-center gap-2 group"
            >
              <Search size={18} className="group-hover:scale-110 transition-transform" />
              İlan Arabul
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
