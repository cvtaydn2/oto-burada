"use client";

import {
  BarChart3,
  Car,
  ChevronLeft,
  CreditCard,
  Database,
  Flag,
  HelpCircle,
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
    description: "Durum özeti",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Analitik & Raporlar",
    description: "Metrikler",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "İlan Moderasyonu",
    description: "Kuyruk ve yayın",
    href: "/admin/listings",
    icon: Car,
  },
  {
    title: "Araç Veritabanı",
    description: "Referans veri",
    href: "/admin/reference",
    icon: Database,
  },
  {
    title: "Soru Moderasyonu",
    description: "İletişim akışı",
    href: "/admin/questions",
    icon: HelpCircle,
  },
  {
    title: "Şikayet Yönetimi",
    description: "Riskli bildirimler",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    title: "Destek Talepleri",
    description: "Ticket kutusu",
    href: "/admin/tickets",
    icon: MessageSquare,
  },
  {
    title: "Roller & Yetkiler",
    description: "Erişim kontrolü",
    href: "/admin/roles",
    icon: KeyRound,
  },
  {
    title: "Güvenlik & Abuse",
    description: "Savunma yüzeyi",
    href: "/admin/security",
    icon: ShieldCheck,
  },
  {
    title: "Kullanıcı Yönetimi",
    description: "Hesaplar",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Audit Logs",
    description: "İşlem geçmişi",
    href: "/admin/audit",
    icon: History,
  },
  {
    title: "Paket Yönetimi",
    description: "Planlar",
    href: "/admin/plans",
    icon: CreditCard,
  },
  {
    title: "Sistem Ayarları",
    description: "Konfigürasyon",
    href: "/admin/settings",
    icon: Settings,
  },
] as const;

interface AdminSidebarProps {
  isMobile?: boolean;
}

export function AdminSidebar({ isMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Admin paneli navigasyonu"
      className={cn(
        "z-50 flex-col border-r border-border bg-card",
        isMobile ? "flex h-full w-full" : "fixed left-0 top-0 hidden h-screen w-72 md:flex"
      )}
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold leading-none tracking-tight text-foreground">
              OTOBURADA
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              KONTROL PANELİ
            </span>
          </div>
        </Link>

        {isMobile ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Kritik moderasyon yüzeyleri küçük ekranda daha hızlı erişim için gruplanmıştır.
          </p>
        ) : null}
      </div>

      <nav aria-label="Admin menü" className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mb-3 px-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Ana Menü
          </span>
        </div>

        <div className="space-y-1.5">
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
                  "group relative flex items-start gap-3 overflow-hidden rounded-2xl border px-3 py-3 transition-all",
                  isActive
                    ? "border-primary/20 bg-primary/8 text-primary shadow-sm"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                    isActive
                      ? "border-primary/15 bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <item.icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-5">{item.title}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-5",
                      isActive ? "text-primary/80" : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </span>
                </div>

                {isActive ? (
                  <div className="absolute right-0 top-0 h-full w-1 rounded-full bg-primary/30" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto space-y-3 border-t border-border bg-muted/20 p-4 sm:p-5">
        <Link href="/dashboard" className="block w-full">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-2xl border-border bg-background font-bold text-muted-foreground transition-all hover:bg-card hover:text-primary"
          >
            <ChevronLeft size={18} />
            Kullanıcı Paneli
          </Button>
        </Link>

        <div className="rounded-2xl border border-border bg-background p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase leading-none text-foreground">
                Admin Modu
              </span>
              <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Tam yetkili erişim
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
