import Link from "next/link";
import { Bell, CarFront, Heart, PlusCircle, Search, User } from "lucide-react";

import { getCurrentUser, getUserRole } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user ? getUserRole(user) === "admin" : false;
  const accountHref = user ? "/dashboard" : "/login";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <div className="bg-slate-50 font-sans text-sm text-slate-900 border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold text-2xl tracking-tight flex items-center gap-2 text-indigo-900">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <CarFront size={24} />
              </div>
              Oto Burada
            </Link>
            
            <div className="hidden md:flex relative w-[400px]">
              <input 
                type="text" 
                placeholder="Marka, model veya ilan no ile akıllı arama..." 
                className="w-full pl-4 pr-10 py-2.5 bg-slate-100 rounded-lg border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm outline-none"
              />
              <button className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-indigo-600 transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/favorites" className="hover:text-indigo-600 transition-colors hidden sm:block">
              <Heart size={20} />
            </Link>
            {user && (
              <Link href="/dashboard/notifications" className="hover:text-indigo-600 transition-colors hidden sm:block">
                <Bell size={20} />
              </Link>
            )}
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <Link href={accountHref} className="hidden sm:flex items-center gap-2 hover:text-indigo-600 transition-colors">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <span>{user ? "Hesabım" : "Giriş Yap"}</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hidden lg:flex hover:text-indigo-600 transition-colors font-semibold">
                Admin
              </Link>
            )}
            <Link href={postListingHref} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-semibold">
              <PlusCircle size={18} />
              <span className="hidden sm:inline">İlan Ver</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub Navigation */}
      <nav className="bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-2 text-sm font-medium text-slate-600 overflow-x-auto">
          <Link href="/" className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full">Otomobil</Link>
          <Link href="/?category=suv" className="px-4 py-1.5 hover:bg-slate-100 rounded-full transition-colors">Arazi, SUV & Pickup</Link>
          <Link href="/?category=motosiklet" className="px-4 py-1.5 hover:bg-slate-100 rounded-full transition-colors">Motosiklet</Link>
          <Link href="/?category=ticari" className="px-4 py-1.5 hover:bg-slate-100 rounded-full transition-colors">Ticari Araçlar</Link>
          <Link href="/?category=elektrikli" className="px-4 py-1.5 hover:bg-slate-100 rounded-full transition-colors">Elektrikli</Link>
        </div>
      </nav>
    </div>
  );
}
