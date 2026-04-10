"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User as UserIcon, Heart, PlusCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { SearchWithSuggestions } from "@/components/ui/search-with-suggestions";
import type { SearchSuggestionItem } from "@/types";

interface HeaderMobileNavProps {
  user: User | null;
  isAdmin: boolean;
  accountHref: string;
  favoritesHref: string;
  postListingHref: string;
  searchSuggestions: SearchSuggestionItem[];
}

const mobileQuickLinks = [
  { href: "/listings", label: "Tüm İlanlar" },
  { href: "/listings?transmission=otomatik", label: "Otomatik" },
  { href: "/listings?maxMileage=80000&sort=mileage_asc", label: "Düşük KM" },
  { href: "/listings?minYear=2020&sort=year_desc", label: "Yeni Model" },
] as const;

export function HeaderMobileNav({
  user,
  isAdmin,
  accountHref,
  favoritesHref,
  postListingHref,
  searchSuggestions,
}: HeaderMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
        aria-label="Menüyü aç"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl animate-in slide-in-from-top-2">
          <div className="p-4 space-y-4">
            <SearchWithSuggestions
              placeholder="Marka, model veya şehir ara..."
              suggestions={searchSuggestions}
            />

            <div className="flex flex-col gap-2">
              <Link 
                href={accountHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <UserIcon size={18} className="mr-3" />
                {user ? "Hesabım" : "Giriş Yap"}
              </Link>
              <Link 
                href={favoritesHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Heart size={18} className="mr-3" />
                Favoriler
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center h-12 px-4 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Admin Panel
                </Link>
              )}
              <Link 
                href={postListingHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center h-12 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all"
              >
                <PlusCircle size={18} className="mr-2" />
                İlan Ver
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mobileQuickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="shrink-0 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
