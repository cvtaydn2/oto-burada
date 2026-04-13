"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Car, 
  Flag, 
  Users, 
  Settings, 
  ChevronLeft,
  ShieldCheck,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ADMIN_NAV_ITEMS = [
  {
    title: "Genel Bakış",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "İlan Moderasyonu",
    href: "/admin/listings",
    icon: Car,
  },
  {
    title: "Şikayet Yönetimi",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    title: "Kullanıcı Yönetimi",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit",
    icon: History,
  },
  {
    title: "Sistem Ayarları",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white md:flex z-50">
      <div className="flex h-20 items-center px-8 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100 transition-all group-hover:scale-110 group-hover:rotate-3">
            <ShieldCheck size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-slate-800 leading-none">
              OTOBURADA
            </span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1 leading-none">
              KONTROL
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-1.5 custom-scrollbar">
        <div className="mb-4">
           <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ana Menü</span>
        </div>
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all relative overflow-hidden",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
              {item.title}
              {isActive && (
                 <div className="absolute right-0 top-0 h-full w-1 bg-white/20" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-3 mt-auto border-t border-slate-100 bg-slate-50/50">
        <Link href="/dashboard" className="w-full block">
           <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white hover:text-blue-600 transition-all">
              <ChevronLeft size={18} />
              Kullanıcı Paneli
           </Button>
        </Link>
        
        <div className="pt-2">
           <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                 <ShieldCheck className="text-blue-600 size-6" />
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-xs font-black text-slate-800 uppercase italic leading-none">Admin Modu</span>
                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">Tam Yetkili Erişim</span>
              </div>
           </div>
        </div>
      </div>
    </aside>
  );
}
