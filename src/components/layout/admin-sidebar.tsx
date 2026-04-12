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
  ExternalLink,
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
    <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-border bg-background/50 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center px-8 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20 transition-all group-hover:scale-110">
            <ShieldCheck size={18} />
          </div>
          <span className="text-lg font-black tracking-tighter text-foreground">
            Admin<span className="text-primary italic">Panel</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 mt-auto border-t border-border">
        <Link href="/dashboard" className="w-full">
           <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft size={16} />
              Kullanıcı Paneli
           </Button>
        </Link>
        <Link href="/" className="w-full">
           <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <ExternalLink size={16} />
              Siteye Dön
           </Button>
        </Link>
        <div className="pt-4 px-4 pb-2">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                 <ShieldCheck className="text-primary size-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-black uppercase tracking-widest italic">Admin Mode</span>
                 <span className="text-[10px] text-muted-foreground font-medium">Full Access</span>
              </div>
           </div>
        </div>
      </div>
    </aside>
  );
}
