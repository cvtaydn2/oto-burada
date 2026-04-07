import Link from "next/link";
import { Bell, CarFront, Heart, PlusCircle, Search, User, Menu } from "lucide-react";

import { getCurrentUser, getUserRole } from "@/lib/auth/session";
import { HeaderMobileNav } from "./header-mobile-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user ? getUserRole(user) === "admin" : false;
  const accountHref = user ? "/dashboard" : "/login";
  const postListingHref = user ? "/dashboard/listings" : "/login";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <CarFront size={20} className="drop-shadow-sm" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
                OtoBurada
              </span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Marka, model veya şehir ara..." 
                className="w-full h-10 pl-11 pr-4 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {user && (
              <Link 
                href="/dashboard/notifications" 
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
                title="Bildirimler"
              >
                <Bell size={20} />
              </Link>
            )}
            <Link 
              href="/favorites" 
              className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
              title="Favoriler"
            >
              <Heart size={20} />
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center justify-center h-10 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
              >
                Admin
              </Link>
            )}
            <Link 
              href={accountHref}
              className="flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <User size={18} className="mr-2" />
              {user ? "Hesabım" : "Giriş"}
            </Link>
            <Link 
              href={postListingHref} 
              className="flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all ml-1"
            >
              <PlusCircle size={18} className="mr-2" />
              İlan Ver
            </Link>
          </nav>

          <HeaderMobileNav user={user} isAdmin={isAdmin} accountHref={accountHref} postListingHref={postListingHref} />
        </div>
      </div>
    </header>
  );
}