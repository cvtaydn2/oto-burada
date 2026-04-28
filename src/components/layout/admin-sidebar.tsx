"use client";

import {
  BarChart3,
  Car,
  ChevronLeft,
  CreditCard,
  Database,
  Flag,
  History,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  {
    title: "Genel Bakış",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Analitik & Raporlar",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "İlan Moderasyonu",
    href: "/admin/listings",
    icon: Car,
  },
  {
    title: "Araç Veritabanı",
    href: "/admin/reference",
    icon: Database,
  },
  {
    title: "Şikayet Yönetimi",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    title: "Destek Talepleri",
    href: "/admin/tickets",
    icon: MessageSquare,
  },
  {
    title: "Roller & Yetkiler",
    href: "/admin/roles",
    icon: KeyRound,
  },
  {
    title: "Güvenlik & Abuse",
    href: "/admin/security",
    icon: ShieldCheck,
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
    title: "Paket Yönetimi",
    href: "/admin/plans",
    icon: CreditCard,
  },
  {
    title: "Sistem Ayarları",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  isMobile?: boolean;
}

export function AdminSidebar({ isMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Admin paneli navigasyonu"
      className={cn(
        "flex-col border-r border-border bg-card z-50",
        isMobile ? "flex h-full w-full" : "fixed left-0 top-0 hidden h-screen w-72 md:flex"
      )}
    >
      <div className="flex h-20 items-center px-8 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              OTOBURADA
            </span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 leading-none">
              KONTROL
            </span>
          </div>
        </Link>
      </div>

      <nav
        aria-label="Admin menü"
        className="flex-1 overflow-y-auto p-6 space-y-1.5 custom-scrollbar"
      >
        <div className="mb-4">
          <span className="px-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Ana Menü
          </span>
        </div>
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all relative overflow-hidden",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.title}
              {isActive && <div className="absolute right-0 top-0 h-full w-1 bg-white/20" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-3 mt-auto border-t border-border bg-muted/30">
        <Link href="/dashboard" className="w-full block">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl border-border text-muted-foreground font-bold hover:bg-card hover:text-primary transition-all"
          >
            <ChevronLeft size={18} />
            Kullanıcı Paneli
          </Button>
        </Link>

        <div className="pt-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center border border-border">
              <ShieldCheck className="text-primary size-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-foreground uppercase leading-none">
                Admin Modu
              </span>
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest mt-1 truncate">
                Tam Yetkili Erişim
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
