import Image from "next/image"
import { Search, CarFront, MapPin } from "lucide-react"

interface HomeHeroProps {
  cities: string[];
}

export function HomeHero({ cities }: HomeHeroProps) {
  return (
    <section className="hero-bg min-h-[500px] py-12 md:py-0 md:h-[500px] flex items-center relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=70"
          alt="Oto Burada ana sayfa vitrin görseli"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1920px"
          quality={70}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Hayalindeki Aracı Bugün Bul
        </h1>
        <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto font-light">
          Türkiye&apos;nin en geniş araç ağıyla, güvenli ve hızlı otomobil alışverişinin adresi.
        </p>
        
        <form
          action="/listings"
          method="GET"
          className="bg-white p-4 rounded-2xl shadow-xl max-w-4xl mx-auto text-left flex flex-col md:flex-row gap-4"
        >
          
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-1">Marka / Model</label>
            <div className="relative">
              <CarFront size={16} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                name="query"
                placeholder="Örn: BMW 3 Serisi" 
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block pl-10 p-2.5 outline-none transition"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-1">Şehir</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <select 
                name="city"
                defaultValue=""
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block pl-10 p-2.5 outline-none appearance-none cursor-pointer"
              >
                <option value="">Tüm Şehirler</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-1">Fiyat Aralığı</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                name="minPrice"
                placeholder="Min TL" 
                min={0}
                className="w-1/2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block p-2.5 outline-none text-sm transition" 
              />
              <input 
                type="number" 
                name="maxPrice"
                placeholder="Maks TL" 
                min={0}
                className="w-1/2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block p-2.5 outline-none text-sm transition" 
              />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-8 py-2.5 transition shadow-md flex items-center justify-center"
            >
              <Search size={18} className="mr-2" /> İlanları Ara
            </button>
          </div>

        </form>
      </div>
    </section>
  )
}
