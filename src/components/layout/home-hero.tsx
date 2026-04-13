"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

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
    <section className="relative mb-24 w-full overflow-visible">
      <div className="relative h-[500px] w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-110" 
          style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1503375822722-ec8cb7a4c7e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }} 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-4 max-w-4xl text-4xl font-extrabold leading-tight text-white md:text-5xl tracking-tight">
            Hayalindeki Aracı Bugün Bul
          </h1>
          <p className="max-w-2xl text-lg font-light leading-relaxed text-gray-200">
            Türkiye&apos;nin en geniş araç ağıyla, güvenli ve hızlı otomobil alışverişinin adresi.
          </p>
        </div>
      </div>

      <div className="absolute left-1/2 -bottom-10 w-full max-w-4xl -translate-x-1/2 px-4">
        <form 
          onSubmit={handleSearch}
          className="flex flex-col items-stretch gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl lg:flex-row lg:items-center"
        >
          <div className="flex flex-1 flex-col gap-1 border-b border-slate-100 px-4 py-3 lg:border-b-0 lg:border-r lg:px-5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">MARKA / MODEL</label>
            <input 
              type="text" 
              placeholder="Örn: BMW 3 Serisi" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-none bg-transparent p-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0"
            />
          </div>

          <div className="flex flex-1 flex-col gap-1 border-b border-slate-100 px-4 py-3 lg:border-b-0 lg:border-r lg:px-5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">ŞEHİR</label>
            <select 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="cursor-pointer appearance-none border-none bg-transparent p-0 text-sm font-medium text-slate-900 focus:ring-0"
            >
              <option value="">Tüm Şehirler</option>
              <option value="İstanbul">İstanbul</option>
              <option value="Ankara">Ankara</option>
              <option value="İzmir">İzmir</option>
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1 px-4 py-3 lg:px-5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">FİYAT ARALIĞI</label>
            <input 
              type="number" 
              placeholder="Maksimum TL" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="border-none bg-transparent p-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0"
            />
          </div>

          <button 
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
          >
            <Search size={16} />
            İlanları Ara
          </button>
        </form>
      </div>
    </section>
  )
}
