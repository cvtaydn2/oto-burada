import Link from "next/link";
import { Bell, CarFront, Heart, PlusCircle, Search, User } from "lucide-react";

import { getCurrentUser, getUserRole } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user ? getUserRole(user) === "admin" : false;
  const accountHref = user ? "/dashboard" : "/login";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <div className="font-sans text-sm border-b border-slate-200 sticky top-0 z-50 shadow-sm bg-white">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2 text-indigo-900 shrink-0">
              <div className="bg-indigo-600 text-white p-1 rounded-md">
                <CarFront size={20} />
              </div>
              OtoBurada
            </Link>
            
            <div className="hidden md:flex relative flex-1 max-w-xl mx-4">
              <input 
                type="text" 
                placeholder="Kelime, ilan no veya satıcı ile ara..." 
                className="w-full pl-4 pr-10 py-2 bg-slate-100 rounded-md border-transparent focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-[13px] outline-none"
              />
              <button className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center">
                <Search size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-700 shrink-0">
            {user && (
              <Link href="/dashboard/notifications" className="hover:text-indigo-600 transition-colors hidden sm:block" title="Bildirimler">
                <Bell size={18} />
              </Link>
            )}
            <Link href="/favorites" className="hover:text-indigo-600 transition-colors hidden sm:block" title="Favoriler">
              <Heart size={18} />
            </Link>
            <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>
            <Link href={accountHref} className="hidden sm:flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <User size={14} />
              </div>
              <span>{user ? "Hesabım" : "Giriş Yap"}</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hidden lg:flex hover:text-indigo-600 transition-colors font-semibold">
                Admin
              </Link>
            )}
            <Link href={postListingHref} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-sm ml-2 font-semibold">
              <PlusCircle size={16} />
              <span>İlan Ver</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sub Navigation */}
      <nav className="bg-slate-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-6 text-[13px] font-medium text-slate-600 overflow-x-auto">
          <Link href="/" className="text-indigo-700 border-b-2 border-indigo-600 h-full flex items-center">Otomobil</Link>
          <Link href="/?category=suv" className="hover:text-indigo-600 h-full flex items-center transition-colors border-b-2 border-transparent hover:border-slate-300">Arazi, SUV & Pickup</Link>
          <Link href="/?category=motosiklet" className="hover:text-indigo-600 h-full flex items-center transition-colors border-b-2 border-transparent hover:border-slate-300">Motosiklet</Link>
          <Link href="/?category=ticari" className="hover:text-indigo-600 h-full flex items-center transition-colors border-b-2 border-transparent hover:border-slate-300">Ticari Araçlar</Link>
          <Link href="/?category=elektrikli" className="hover:text-indigo-600 h-full flex items-center transition-colors border-b-2 border-transparent hover:border-slate-300">Elektrikli</Link>
        </div>
      </nav>
    </div>
  );
}

